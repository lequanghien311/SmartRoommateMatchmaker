import { api } from './api.js';
export const reportService = {
  list: () => api('/reports'),
  create: (input) => api('/reports', { method: 'POST', body: JSON.stringify(input) }),
};

