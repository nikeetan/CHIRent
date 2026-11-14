import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validCredentials, createSession, readSession, clearSession, SESSION_KEY, SESSION_TTL } from '../public/auth.js';
const memoryStorage = () => {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
};
test('only requested demo credentials are accepted', () => {
  assert.equal(validCredentials('admin', 'admin'), true);
  assert.equal(validCredentials(' admin ', 'admin'), true);
  assert.equal(validCredentials('admin', 'wrong'), false);
  assert.equal(validCredentials('Admin', 'admin'), false);
  assert.equal(validCredentials('admin', 'admin '), false);
});
test('demo session survives reload, expires, and is removed on sign out', () => {
  const storage = memoryStorage();
  assert.equal(readSession(storage, 1000), false);
  assert.equal(createSession(storage, 1000), true);
  assert.equal(readSession(storage, 2000), true);
  assert.equal(readSession(storage, 1000 + SESSION_TTL), false);
  clearSession(storage);
  assert.equal(readSession(storage, 2000), false);
});
test('malformed session data and unavailable storage fail gracefully', () => {
  const storage = memoryStorage();
  storage.setItem(SESSION_KEY, '{broken'); assert.equal(readSession(storage), false);
  storage.setItem(SESSION_KEY, JSON.stringify({ user: 'admin', expiresAt: 'forever' })); assert.equal(readSession(storage), false);
  const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.equal(readSession(denied), false); assert.equal(createSession(denied), false); assert.doesNotThrow(() => clearSession(denied));
});
