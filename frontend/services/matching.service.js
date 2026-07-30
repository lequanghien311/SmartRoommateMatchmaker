import { api } from './api.js';
export const matchingService = {
  profile: () => api('/roommate-profile'),
  saveProfile: (input) => api('/roommate-profile', { method: 'PUT', body: JSON.stringify(input) }),
  list: () => api('/matches'),
  detail: (id) => api(`/matches/${id}`),
};

