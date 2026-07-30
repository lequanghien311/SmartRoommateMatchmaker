import { api } from './api.js';
export const adminService = {
  dashboard: () => api('/admin/dashboard'),
  users: (params = '') => api(`/admin/users?${params}`),
  setUserStatus: (id, status) => api(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  rooms: (params = '') => api(`/admin/rooms?${params}`),
  moderateRoom: (id, input) => api(`/admin/rooms/${id}/status`, { method: 'PATCH', body: JSON.stringify(input) }),
  reports: (params = '') => api(`/admin/reports?${params}`),
  resolveReport: (id, input) => api(`/admin/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify(input) }),
};

