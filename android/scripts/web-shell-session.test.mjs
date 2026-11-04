import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createAuthTokenPersistence } from '../src/domains/auth/authTokenPersistence.ts';
import {
  createWebShellSessionSnapshotBridgeScript,
  createWebShellSessionSnapshotRequestScript,
  createWebShellSessionSyncScript,
  parseWebShellSessionSnapshot,
} from '../src/domains/webShell/webShellSessionBridge.ts';

const ACCESS = 'gachi-gacha:access-token';
const REFRESH = 'gachi-gacha:refresh-token';
const SNAPSHOT = 'gachigacha:auth-session-snapshot';
const token = (memberId, issuedAt) => [
  'header', Buffer.from(JSON.stringify({ memberId, type: 'access', iat: issuedAt })).toString('base64url'), 'signature',
].join('.');
const pair = (memberId, issuedAt) => ({ accessToken: token(memberId, issuedAt), refreshToken: `refresh-${memberId}-${issuedAt}` });

function browser(tokens = null) {
  class Storage {
    entries = new Map();
    getItem(key) { return this.entries.get(key) ?? null; }
    setItem(key, value) { this.entries.set(key, String(value)); }
    removeItem(key) { this.entries.delete(key); }
    clear() { this.entries.clear(); }
  }
  const messages = [];
  let reloads = 0;
  const window = {
    atob,
    sessionStorage: new Storage(),
    localStorage: new Storage(),
    location: { reload() { reloads++; } },
    ReactNativeWebView: { postMessage(value) { messages.push(JSON.parse(value)); } },
  };
  if (tokens) {
    window.sessionStorage.setItem(ACCESS, tokens.accessToken);
    window.sessionStorage.setItem(REFRESH, tokens.refreshToken);
  }
  return {
    window, messages,
    run(script) { new Function('window', 'Storage', script)(window, Storage); },
    get reloads() { return reloads; },
    get tokens() {
      return { accessToken: window.sessionStorage.getItem(ACCESS), refreshToken: window.sessionStorage.getItem(REFRESH) };
    },
  };
}

test('trusted message parser accepts a complete token pair and null, rejects partial/malformed data', () => {
  const tokens = pair(1, 2);
  assert.deepEqual(parseWebShellSessionSnapshot(JSON.stringify({ type: SNAPSHOT, tokens })), { tokens });
  assert.deepEqual(parseWebShellSessionSnapshot(JSON.stringify({ type: SNAPSHOT, tokens: null })), { tokens: null });
  for (const message of [null, {}, { type: SNAPSHOT }, { type: SNAPSHOT, tokens: {} },
    { type: SNAPSHOT, tokens: { accessToken: 'a', refreshToken: ' ' } },
    { type: 'gachigacha:auth-refresh-token', token: 'refresh' }]) {
    assert.equal(parseWebShellSessionSnapshot(JSON.stringify(message)), null);
  }
  assert.equal(parseWebShellSessionSnapshot('{bad'), null);
});

test('web refresh snapshots access and refresh together after both storage writes', async () => {
  const app = browser(pair(1, 1));
  const next = pair(1, 2);
  app.run(createWebShellSessionSnapshotBridgeScript());
  app.run(createWebShellSessionSnapshotBridgeScript());
  app.window.sessionStorage.setItem(ACCESS, next.accessToken);
  app.window.sessionStorage.setItem(REFRESH, next.refreshToken);
  assert.deepEqual(app.messages, []);
  await Promise.resolve();
  assert.deepEqual(app.messages, [{ type: SNAPSHOT, tokens: next }]);
  app.window.localStorage.setItem(REFRESH, 'not-session');
  await Promise.resolve();
  assert.equal(app.messages.length, 1);
});

test('partial writes never report logout; explicit remove/clear report null after the pair is gone', async () => {
  const app = browser();
  app.run(createWebShellSessionSnapshotBridgeScript());
  app.window.sessionStorage.setItem(ACCESS, 'a');
  await Promise.resolve();
  assert.equal(app.messages.length, 0);
  app.window.sessionStorage.setItem(REFRESH, 'r');
  await Promise.resolve();
  app.messages.length = 0;
  app.window.sessionStorage.removeItem(ACCESS);
  await Promise.resolve();
  assert.equal(app.messages.length, 0);
  app.window.sessionStorage.removeItem(REFRESH);
  await Promise.resolve();
  assert.deepEqual(app.messages, [{ type: SNAPSHOT, tokens: null }]);
  app.messages.length = 0;
  app.window.sessionStorage.setItem(ACCESS, 'a');
  app.window.sessionStorage.setItem(REFRESH, 'r');
  app.window.sessionStorage.clear();
  await Promise.resolve();
  assert.deepEqual(app.messages, [{ type: SNAPSHOT, tokens: null }]);
});

test('legacy refresh-only signal reads the live full pair instead of mixing it with old native access', () => {
  const next = pair(2, 4);
  const app = browser(next);
  app.run(createWebShellSessionSnapshotRequestScript());
  assert.deepEqual(app.messages, [{ type: SNAPSHOT, tokens: next }]);
});

test('same-member rotation from native push registration updates storage without reload or a mirror loop', async () => {
  const app = browser(pair(1, 1));
  app.run(createWebShellSessionSnapshotBridgeScript());
  app.run(createWebShellSessionSyncScript(pair(1, 2)));
  await Promise.resolve();
  assert.equal(app.reloads, 0);
  assert.deepEqual(app.tokens, pair(1, 2));
  assert.deepEqual(app.messages, [{ type: 'gachigacha:auth-session-synced' }]);
  app.run(createWebShellSessionSyncScript({ ...pair(1, 2), refreshToken: 'another-refresh' }));
  assert.equal(app.reloads, 0);
});

test('same tokens are idempotent; initial login/logout/account replacement retain a document reset', () => {
  const same = browser(pair(1, 1));
  same.run(createWebShellSessionSyncScript(pair(1, 1)));
  assert.equal(same.reloads, 0);
  for (const [current, next] of [
    [null, pair(1, 1)], [pair(1, 1), null], [pair(1, 1), pair(2, 2)],
    [{ accessToken: 'unknown-old', refreshToken: 'r' }, { accessToken: 'unknown-new', refreshToken: 'r2' }],
  ]) {
    const app = browser(current);
    app.run(createWebShellSessionSyncScript(next));
    assert.equal(app.reloads, 1);
    assert.deepEqual(app.messages, []);
  }
  const guest = browser();
  guest.run(createWebShellSessionSyncScript(null));
  assert.equal(guest.reloads, 0);
});

function persistence(initial = null, overrides = {}) {
  let value = initial ? JSON.stringify(initial) : null;
  const writes = [];
  const storage = createAuthTokenPersistence({
    read: async () => value,
    write: async (next) => { writes.push(next); value = next; },
    remove: async () => { writes.push(null); value = null; },
    ...overrides,
  });
  return { storage, writes };
}

test('full web snapshot is persisted as a pair for cold boot, with idempotent notifications', async () => {
  const { storage, writes } = persistence(pair(1, 1));
  const changes = [];
  const unsubscribe = storage.subscribe(next => changes.push(next));
  await storage.store(pair(1, 2));
  assert.deepEqual(await storage.read(), pair(1, 2));
  await storage.store(pair(1, 2));
  assert.equal(writes.length, 1);
  assert.deepEqual(changes, [pair(1, 2)]);
  unsubscribe();
  await storage.clear();
  assert.deepEqual(await storage.read(), null);
  assert.equal(changes.length, 1);
});

test('a delayed write cannot complete after a later logout clear and resurrect the session', async () => {
  let release;
  let value = null;
  const gate = new Promise(resolve => { release = resolve; });
  const { storage } = persistence(null, {
    read: async () => value,
    write: async next => { await gate; value = next; },
    remove: async () => { value = null; },
  });
  const changes = [];
  storage.subscribe(next => changes.push(next));
  const pendingWrite = storage.store(pair(1, 1));
  const pendingClear = storage.clear();
  release();
  await Promise.all([pendingWrite, pendingClear]);
  assert.equal(await storage.read(), null);
  assert.deepEqual(changes, [pair(1, 1), null]);
  await storage.updateRefreshToken('late-refresh');
  assert.equal(await storage.read(), null);
});

test('failed writes do not poison future cleanup; listener exceptions do not fail storage', async () => {
  const { storage } = persistence(pair(1, 1), { write: async () => { throw new Error('disk'); } });
  storage.subscribe(() => { throw new Error('listener'); });
  await assert.rejects(storage.store(pair(1, 2)), /disk/);
  await assert.doesNotReject(storage.clear());
  assert.equal(await storage.read(), null);
});

test('malformed persisted credentials are removed before cold boot uses them', async () => {
  let value = '{bad';
  const { storage } = persistence(null, {
    read: async () => value, remove: async () => { value = null; },
  });
  const changes = [];
  storage.subscribe(next => changes.push(next));
  assert.equal(await storage.read(), null);
  assert.equal(value, null);
  assert.deepEqual(changes, [null]);
});

test('gallery return does not rerun native cold-start restoration; full snapshots are origin gated', () => {
  const source = readFileSync(new URL('../src/screens/WebAppShellScreen.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /retryAuthSession|AppState\.addEventListener/);
  assert.match(source, /subscribeAuthTokens/);
  assert.match(source, /if \(!isTrustedWebShellMessageSource[\s\S]*?return;[\s\S]*?parseWebShellSessionSnapshot\(data\)/);
  assert.doesNotMatch(source, /updateStoredRefreshToken/);
});
