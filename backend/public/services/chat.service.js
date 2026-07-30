import { api } from './api.js';
import { state } from '../assets/js/utils/state.js';

let socket;

export const chatService = {
  list: () => api('/conversations'),
  create: (input) => api('/conversations', { method: 'POST', body: JSON.stringify(input) }),
  messages: (id) => api(`/conversations/${id}/messages`),
  send: (id, content) => api(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  read: (id) => api(`/conversations/${id}/read`, { method: 'PATCH' }),
  connect(handlers = {}) {
    if (!window.io || !state.token) return null;
    if (!socket) socket = window.io({ auth: { token: state.token } });
    socket.off('message:new').on('message:new', (message) => handlers.onMessage?.(message));
    socket.off('message:deleted').on('message:deleted', (message) => handlers.onDelete?.(message));
    socket.off('typing').on('typing', (event) => handlers.onTyping?.(event));
    socket.off('presence').on('presence', (event) => handlers.onPresence?.(event));
    return socket;
  },
  join(conversationId) {
    socket?.emit('conversation:join', conversationId);
  },
  typing(conversationId, typing) {
    socket?.emit('typing', { conversationId, typing });
  },
  disconnect() {
    socket?.disconnect();
    socket = null;
  },
};
