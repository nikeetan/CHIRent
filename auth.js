// Public demo credentials. This is a UX gate, not authentication or access control.
export const SESSION_KEY = 'chirent.demo-session.v1';
export const SESSION_TTL = 8 * 60 * 60 * 1000;
export function validCredentials(username, password) {
  return username.trim() === 'admin' && password === 'admin';
}
export function readSession(storage, now = Date.now()) {
  try {
    const session = JSON.parse(storage.getItem(SESSION_KEY));
    return session?.user === 'admin' && Number.isFinite(session.expiresAt) && session.expiresAt > now && session.expiresAt <= now + SESSION_TTL;
  } catch { return false; }
}
export function createSession(storage, now = Date.now()) {
  try { storage.setItem(SESSION_KEY, JSON.stringify({ user: 'admin', expiresAt: now + SESSION_TTL })); return true; }
  catch { return false; }
}
export function clearSession(storage) {
  try { storage.removeItem(SESSION_KEY); } catch { /* Still clear the in-memory UI session. */ }
}
