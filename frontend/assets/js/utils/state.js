const KEY = 'smart-roommate-session';

export const state = {
  session: JSON.parse(localStorage.getItem(KEY) || 'null'),
  setSession(session) {
    this.session = session;
    localStorage.setItem(KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('session:changed'));
  },
  clearSession() {
    this.session = null;
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('session:changed'));
  },
  get token() {
    return this.session?.accessToken;
  },
  get user() {
    return this.session?.user;
  },
};

