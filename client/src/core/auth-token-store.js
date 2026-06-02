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

// ── Refresh callback ─────────────────────────────────────────────────────────
// The AuthProvider registers a refresh function here at mount so that
// apiClient's 401 interceptor can trigger a token refresh without a
// circular dependency on the React context.
let _refreshFn = null;

export function setRefreshCallback(fn) {
  _refreshFn = fn;
}

export function callRefresh() {
  if (!_refreshFn) return Promise.resolve(null);
  return _refreshFn();
}
