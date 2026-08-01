import { api } from './api.js';
import { state } from '../assets/js/utils/state.js';

let socket;
let pubsubSocket;

export const chatService = {
  list: () => api('/conversations'),
  create: (input) => api('/conversations', { method: 'POST', body: JSON.stringify(input) }),
  messages: (id) => api(`/conversations/${id}/messages`),
  send: (id, content) => api(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  read: (id) => api(`/conversations/${id}/read`, { method: 'PATCH' }),
  getPubSubToken: () => api('/conversations/pubsub-token'),
  async connect(handlers = {}) {
    if (!state.token) return null;
    try {
      const res = await this.getPubSubToken();
      if (res.success && res.data?.url) {
        pubsubSocket = new WebSocket(res.data.url, 'json.webpubsub.azure.v1');
        pubsubSocket.provider = 'azure-web-pubsub';
        pubsubSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'message:new' || data.type === 'message') handlers.onMessage?.(data.data || data);
          } catch (_) { /* ignore */ }
        };
        return pubsubSocket;
      }
    } catch (_) { /* fallback to socket.io */ }

    if (window.io && !socket) {
      socket = window.io({ auth: { token: state.token } });
      socket.provider = 'socketio';
      socket.off('message:new').on('message:new', (message) => handlers.onMessage?.(message));
      socket.off('message:deleted').on('message:deleted', (message) => handlers.onDelete?.(message));
      socket.off('typing').on('typing', (event) => handlers.onTyping?.(event));
      socket.off('presence').on('presence', (event) => handlers.onPresence?.(event));
      return socket;
    }
    return null;
  },
  join(conversationId) {
    socket?.emit('conversation:join', conversationId);
    if (pubsubSocket && pubsubSocket.readyState === WebSocket.OPEN) {
      pubsubSocket.send(JSON.stringify({ type: 'joinGroup', group: `conversation:${conversationId}` }));
    }
  },
  typing(conversationId, typing) {
    socket?.emit('typing', { conversationId, typing });
  },
  disconnect() {
    socket?.disconnect();
    socket = null;
    pubsubSocket?.close();
    pubsubSocket = null;
  },
};
