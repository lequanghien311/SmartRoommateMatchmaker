const fs = require('fs');
const path = require('path');

const frontendServicePath = path.resolve(__dirname, '../../frontend/services/chat.service.js');
const deployedServicePath = path.resolve(__dirname, '../public/services/chat.service.js');
const frontendViewsPath = path.resolve(__dirname, '../../frontend/pages/views.js');
const deployedViewsPath = path.resolve(__dirname, '../public/pages/views.js');
const frontendAppPath = path.resolve(__dirname, '../../frontend/assets/js/app.js');
const deployedAppPath = path.resolve(__dirname, '../public/assets/js/app.js');

function loadChatModule({ api = jest.fn(), WebSocketImpl, windowImpl = { addEventListener: jest.fn() } } = {}) {
  const source = fs.readFileSync(frontendServicePath, 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/\bexport\s+/g, '');
  const factory = new Function(
    'api',
    'state',
    'WebSocket',
    'window',
    `${source}\nreturn { chatService, parsePubSubFrame, RECONNECT_DELAYS, POLLING_INTERVAL };`,
  );
  return factory(api, { token: 'test-token' }, WebSocketImpl, windowImpl);
}

class ManualWebSocket {
  static OPEN = 1;
  static CLOSING = 2;
  static instances = [];

  constructor(url, protocol) {
    this.url = url;
    this.protocol = protocol;
    this.readyState = 0;
    ManualWebSocket.instances.push(this);
  }

  open() {
    this.readyState = ManualWebSocket.OPEN;
    this.onopen?.();
  }

  close() {
    const wasOpen = this.readyState === ManualWebSocket.OPEN;
    this.readyState = 3;
    if (wasOpen) this.onclose?.();
  }

  emit(data) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('Web PubSub frontend client', () => {
  beforeEach(() => {
    ManualWebSocket.instances = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test.each(['message:new', 'message:deleted', 'message:read'])(
    'unwrap đúng Azure frame %s',
    (eventName) => {
      const { parsePubSubFrame } = loadChatModule({ WebSocketImpl: ManualWebSocket });
      expect(parsePubSubFrame(JSON.stringify({
        type: 'message',
        data: { event: eventName, data: { conversation_id: 'c1' } },
      }))).toEqual({
        kind: 'event',
        type: eventName,
        data: { conversation_id: 'c1' },
      });
    },
  );

  test('conversation khác không cập nhật handler hiện tại', async () => {
    const api = jest.fn().mockResolvedValue({ success: true, data: { url: 'wss://example' } });
    const { chatService } = loadChatModule({ api, WebSocketImpl: ManualWebSocket });
    const handlers = { onMessage: jest.fn(), onDelete: jest.fn(), onRead: jest.fn() };
    const connection = chatService.connect('c1', handlers);
    await Promise.resolve();
    ManualWebSocket.instances[0].open();
    await connection;

    for (const eventName of ['message:new', 'message:deleted', 'message:read']) {
      ManualWebSocket.instances[0].emit({
        type: 'message',
        data: { event: eventName, data: { conversation_id: 'c2' } },
      });
    }
    expect(handlers.onMessage).not.toHaveBeenCalled();
    expect(handlers.onDelete).not.toHaveBeenCalled();
    expect(handlers.onRead).not.toHaveBeenCalled();
    chatService.disconnect();
  });

  test('reconnect tối đa 3 lần rồi chuyển polling 4 giây', async () => {
    jest.useFakeTimers();
    class FailingWebSocket extends ManualWebSocket {
      constructor(url, protocol) {
        super(url, protocol);
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    const api = jest.fn().mockResolvedValue({ success: true, data: { url: 'wss://example' } });
    const { chatService } = loadChatModule({ api, WebSocketImpl: FailingWebSocket });
    const onPoll = jest.fn();
    const onStatus = jest.fn();
    const connection = chatService.connect('c1', { onPoll, onStatus });
    await jest.advanceTimersByTimeAsync(0);
    await connection;
    for (let retry = 0; retry < 3; retry += 1) {
      await jest.advanceTimersToNextTimerAsync();
      await jest.advanceTimersToNextTimerAsync();
    }

    expect(api).toHaveBeenCalledTimes(4);
    expect(ManualWebSocket.instances).toHaveLength(4);
    expect(onStatus).toHaveBeenCalledWith('degraded');
    await jest.advanceTimersByTimeAsync(4000);
    expect(onPoll).toHaveBeenCalled();
    const pollCountBeforeDisconnect = onPoll.mock.calls.length;

    chatService.disconnect();
    await jest.advanceTimersByTimeAsync(8000);
    expect(onPoll).toHaveBeenCalledTimes(pollCountBeforeDisconnect);
  });

  test('reconnect lấy token mới và reload đúng một lần khi thành công', async () => {
    jest.useFakeTimers();
    let attempt = 0;
    class RecoveringWebSocket extends ManualWebSocket {
      constructor(url, protocol) {
        super(url, protocol);
        attempt += 1;
        setTimeout(() => {
          if (attempt === 1) this.onerror?.();
          else this.open();
        }, 0);
      }
    }
    const api = jest.fn().mockResolvedValue({ success: true, data: { url: 'wss://example' } });
    const { chatService } = loadChatModule({ api, WebSocketImpl: RecoveringWebSocket });
    const onReconnect = jest.fn();
    const connection = chatService.connect('c1', { onReconnect });
    await jest.advanceTimersByTimeAsync(0);
    await connection;
    await jest.advanceTimersToNextTimerAsync();
    await jest.advanceTimersToNextTimerAsync();
    await Promise.resolve();

    expect(api).toHaveBeenCalledTimes(2);
    expect(onReconnect).toHaveBeenCalledTimes(1);
    chatService.disconnect();
  });

  test('hai bản chat service deploy được đồng bộ byte-for-byte', () => {
    expect(fs.readFileSync(frontendServicePath, 'utf8'))
      .toBe(fs.readFileSync(deployedServicePath, 'utf8'));
  });

  test('conversation view và lifecycle cleanup được đồng bộ ở hai frontend', () => {
    const extractConversationView = (filePath) => fs.readFileSync(filePath, 'utf8')
      .match(/export async function conversations[\s\S]*?(?=\nexport async function notifications)/)?.[0];
    expect(extractConversationView(frontendViewsPath)).toBe(extractConversationView(deployedViewsPath));

    const cleanupLine = "if (!/^\\/conversations\\/[0-9a-f-]+$/.test(location.pathname)) chatService.disconnect();";
    expect(fs.readFileSync(frontendAppPath, 'utf8')).toContain(cleanupLine);
    expect(fs.readFileSync(deployedAppPath, 'utf8')).toContain(cleanupLine);
  });
});
