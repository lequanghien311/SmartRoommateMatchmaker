import { api } from './api.js';
export const notificationService = {
  list: () => api('/notifications'),
  unread: () => api('/notifications/unread-count'),
  read: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => api('/notifications/read-all', { method: 'PATCH' }),
};

