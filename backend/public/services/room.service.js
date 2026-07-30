import { api } from './api.js';
export const roomService = {
  search: (params = new URLSearchParams()) => api(`/rooms?${params}`),
  detail: (id) => api(`/rooms/${id}`),
  mine: () => api('/rooms/mine'),
  create: (input) => api('/rooms', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => api(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  transition: (id, status, reason) => api(`/rooms/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  amenities: () => api('/amenities'),
  favorites: () => api('/favorites'),
  favorite: (id) => api(`/favorites/${id}`, { method: 'POST' }),
  unfavorite: (id) => api(`/favorites/${id}`, { method: 'DELETE' }),
};

