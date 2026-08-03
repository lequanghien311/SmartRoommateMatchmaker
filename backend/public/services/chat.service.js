import { api } from './api.js';
import { state } from '../assets/js/utils/state.js';

let pubsubSocket;
let connectionVersion = 0;

export function parsePubSubFrame(rawFrame) {
  let frame;
  try {
    frame = typeof rawFrame === 'string' ? JSON.parse(rawFrame) : rawFrame;
  } catch (_error) {
    return null;
  }

  if (frame?.type === 'system' || frame?.type === 'ack') {
    return { kind: 'system', type: frame.event || frame.type, data: frame };
  }

  const payload = frame?.type === 'message' ? frame.data : frame;
  if (!payload?.event) return null;
  return { kind: 'event', type: payload.event, data: payload.data };
}

function closeCurrentSocket() {
  const current = pubsubSocket;
  pubsubSocket = null;
  if (current && current.readyState < WebSocket.CLOSING) current.close();
}

export const chatService = {
  list: () => api('/conversations'),
  create: (input) => api('/conversations', { method: 'POST', body: JSON.stringify(input) }),
  messages: (id) => api(`/conversations/${id}/messages`),
  send: (id, content) => api(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  read: (id) => api(`/conversations/${id}/read`, { method: 'PATCH' }),
  getPubSubToken: (conversationId) => api(`/conversations/${conversationId}/pubsub-token`),
  async connect(conversationId, handlers = {}) {
    if (!state.token) return null;
    const version = ++connectionVersion;
    closeCurrentSocket();
    handlers.onStatus?.('connecting');

    const response = await this.getPubSubToken(conversationId);
    if (!response.success || !response.data?.url) throw new Error('Không nhận được URL Azure Web PubSub');

    const ws = new WebSocket(response.data.url, 'json.webpubsub.azure.v1');
    ws.onmessage = (event) => {
      if (version !== connectionVersion) return;
      const message = parsePubSubFrame(event.data);
      if (!message) return;
      if (message.kind === 'system') {
        handlers.onSystem?.(message);
        if (message.type === 'connected') handlers.onStatus?.('connected');
        return;
      }
      if (String(message.data?.conversation_id) !== String(conversationId)) return;
      if (message.type === 'message:new') handlers.onMessage?.(message.data);
      if (message.type === 'message:deleted') handlers.onDelete?.(message.data);
      if (message.type === 'message:read') handlers.onRead?.(message.data);
    };

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Web PubSub connection timeout'));
      }, 8000);
      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Không thể kết nối Azure Web PubSub'));
      };
    });

    if (version !== connectionVersion) {
      ws.close();
      return null;
    }
    pubsubSocket = ws;
    handlers.onStatus?.('connected');
    ws.onclose = () => {
      if (version === connectionVersion) handlers.onStatus?.('disconnected');
    };
    return ws;
  },
  disconnect() {
    connectionVersion += 1;
    closeCurrentSocket();
  },
};
