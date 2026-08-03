import { api } from './api.js';
import { state } from '../assets/js/utils/state.js';

let pubsubSocket;
let connectionVersion = 0;
let reconnectTimer;
let pollingTimer;
let pollingInFlight = false;
let reconnectAttempts = 0;
let deliberateClose = false;
let activeConversationId;
let activeHandlers = {};

export const RECONNECT_DELAYS = [1000, 2000, 4000];
export const POLLING_INTERVAL = 4000;

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

function clearReconnectTimer() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function stopPolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = null;
  pollingInFlight = false;
}

function startPolling(version) {
  if (pollingTimer || deliberateClose || version !== connectionVersion) return;
  activeHandlers.onStatus?.('degraded');
  pollingTimer = setInterval(() => {
    if (deliberateClose || version !== connectionVersion || pollingInFlight) return;
    pollingInFlight = true;
    Promise.resolve(activeHandlers.onPoll?.()).catch(() => {}).finally(() => {
      pollingInFlight = false;
    });
  }, POLLING_INTERVAL);
}

function handleMessage(event, conversationId, handlers, version) {
  if (version !== connectionVersion) return;
  const message = parsePubSubFrame(event.data);
  if (!message) return;
  if (message.kind === 'system') {
    handlers.onSystem?.(message);
    if (message.type === 'connected') handlers.onStatus?.('connected');
    if (message.type === 'disconnected') handlers.onStatus?.('disconnected');
    return;
  }
  if (String(message.data?.conversation_id) !== String(conversationId)) return;
  if (message.type === 'message:new') handlers.onMessage?.(message.data);
  if (message.type === 'message:deleted') handlers.onDelete?.(message.data);
  if (message.type === 'message:read') handlers.onRead?.(message.data);
}

export const chatService = {
  list: () => api('/conversations'),
  create: (input) => api('/conversations', { method: 'POST', body: JSON.stringify(input) }),
  messages: (id) => api(`/conversations/${id}/messages`),
  send: (id, content) => api(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  read: (id) => api(`/conversations/${id}/read`, { method: 'PATCH' }),
  getPubSubToken: (conversationId) => api(`/conversations/${conversationId}/pubsub-token`),
  async openConnection(conversationId, handlers, version) {
    const response = await this.getPubSubToken(conversationId);
    if (!response.success || !response.data?.url) throw new Error('Không nhận được URL Azure Web PubSub');

    const ws = new WebSocket(response.data.url, 'json.webpubsub.azure.v1');
    ws.onmessage = (event) => handleMessage(event, conversationId, handlers, version);
    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        callback();
      };
      const timeout = setTimeout(() => {
        ws.close();
        finish(() => reject(new Error('Web PubSub connection timeout')));
      }, 8000);
      ws.onopen = () => finish(resolve);
      ws.onerror = () => {
        ws.close();
        finish(() => reject(new Error('Không thể kết nối Azure Web PubSub')));
      };
    });

    if (deliberateClose || version !== connectionVersion) {
      ws.close();
      return null;
    }
    pubsubSocket = ws;
    ws.onclose = () => {
      if (pubsubSocket === ws) pubsubSocket = null;
      if (deliberateClose || version !== connectionVersion) return;
      handlers.onStatus?.('disconnected');
      this.scheduleReconnect(version);
    };
    return ws;
  },
  scheduleReconnect(version) {
    if (deliberateClose || reconnectTimer || version !== connectionVersion) return;
    if (reconnectAttempts >= RECONNECT_DELAYS.length) {
      startPolling(version);
      return;
    }
    const delay = RECONNECT_DELAYS[reconnectAttempts];
    reconnectAttempts += 1;
    activeHandlers.onStatus?.('reconnecting');
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      if (deliberateClose || version !== connectionVersion) return;
      try {
        await this.openConnection(activeConversationId, activeHandlers, version);
        if (deliberateClose || version !== connectionVersion) return;
        const wasRecovering = reconnectAttempts > 0 || Boolean(pollingTimer);
        reconnectAttempts = 0;
        stopPolling();
        activeHandlers.onStatus?.('connected');
        if (wasRecovering) await activeHandlers.onReconnect?.();
      } catch (_error) {
        this.scheduleReconnect(version);
      }
    }, delay);
  },
  async connect(conversationId, handlers = {}) {
    if (!state.token) return null;
    deliberateClose = false;
    const version = ++connectionVersion;
    activeConversationId = conversationId;
    activeHandlers = handlers;
    reconnectAttempts = 0;
    clearReconnectTimer();
    stopPolling();
    closeCurrentSocket();
    handlers.onStatus?.('connecting');
    try {
      const ws = await this.openConnection(conversationId, handlers, version);
      if (ws) handlers.onStatus?.('connected');
      return ws;
    } catch (_error) {
      this.scheduleReconnect(version);
      return null;
    }
  },
  disconnect() {
    deliberateClose = true;
    connectionVersion += 1;
    activeConversationId = null;
    activeHandlers = {};
    reconnectAttempts = 0;
    clearReconnectTimer();
    stopPolling();
    closeCurrentSocket();
  },
};

window.addEventListener('beforeunload', () => chatService.disconnect());
