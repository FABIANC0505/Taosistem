const ACCESS_TOKEN_KEY = 'access_token';
const USER_KEY = 'user';
export const AUTH_CHANGED_EVENT = 'auth-changed';

const getStorage = () => window.sessionStorage;

export const authStorage = {
  clear() {
    const storage = getStorage();
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  getToken() {
    return getStorage().getItem(ACCESS_TOKEN_KEY);
  },

  getUser() {
    return getStorage().getItem(USER_KEY);
  },

  setAuth(token: string, user: string) {
    const storage = getStorage();
    storage.setItem(ACCESS_TOKEN_KEY, token);
    storage.setItem(USER_KEY, user);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },
};
