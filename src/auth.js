// S37 — session token storage for the HMAC auth flow introduced in S36.
// Module-level because apiCall is defined outside the React tree and must
// attach the token without crossing the component boundary.

const TOKEN_KEY = 'otr-auth-token';
const USER_KEY = 'otr-auth-user';

let _token = null;
let _onAuthFailure = null;

try {
  _token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
} catch {
  _token = null;
}

export const getAuthToken = () => _token;

export const setAuthToken = (token) => {
  _token = token || null;
  try {
    if (_token) localStorage.setItem(TOKEN_KEY, _token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const clearAuth = () => {
  _token = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
};

export const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedUser = (user) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
};

export const setOnAuthFailure = (cb) => { _onAuthFailure = cb; };

export const handleAuthError = (errorCode) => {
  if (errorCode === 'AUTH_EXPIRED' || errorCode === 'AUTH_INVALID') {
    clearAuth();
    if (_onAuthFailure) _onAuthFailure(errorCode);
    return true;
  }
  return false;
};
