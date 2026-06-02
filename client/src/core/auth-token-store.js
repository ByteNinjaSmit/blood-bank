// Module-level token store. The auth provider pushes the current
// access token into here whenever it changes; the axios instance in
// `api-client.js` reads from here on every request so the freshest
// token is always attached.
//
// This decouples the axios instance from React context (axios cannot
// hook), keeps interceptors out of every feature module, and removes
// the fragile `ApiService.initialize(...)` singleton pattern.

let currentToken = null;
const listeners = new Set();

export function getAuthToken() {
  return currentToken;
}

export function setAuthToken(token) {
  if (token === currentToken) return;
  currentToken = token;
  for (const fn of listeners) fn(token);
}

export function clearAuthToken() {
  setAuthToken(null);
}

export function subscribeAuthToken(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
