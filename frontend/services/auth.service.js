import { api } from './api.js';
import { state } from '../assets/js/utils/state.js';

export const authService = {
  async login(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    state.setSession(result.data);
    return result.data;
  },
  async register(input) {
    const result = await api('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    state.setSession(result.data);
    return result.data;
  },
  async logout() {
    await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: state.session?.refreshToken }) }).catch(() => {});
    state.clearSession();
  },
  me: () => api('/users/me'),
  update: (input) => api('/users/me', { method: 'PUT', body: JSON.stringify(input) }),
};

