import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  APP_CONTEXT_TIMEOUT_MS,
  createWebShellAppContext,
  createWebShellAppContextBridgeScript,
  createWebShellAppContextResponseScript,
  parseWebShellAppContextRequest,
} from '../src/domains/webShell/webShellAppContext.ts';

const BASE = 'https://dev.gachigacha.kro.kr';
const REQUEST_TYPE = 'gachigacha:app-context-request';
const RESPONSE_EVENT = 'gachigacha:app-context';
const CONFIG = {
  version: '1.0.0', android: { versionCode: 5 },
  extra: { appVariant: 'development', secret: 'must-not-leak' },
};
const CONTEXT = createWebShellAppContext(CONFIG);

function browser({ origin = BASE, iframe = false, postMessage } = {}) {
  const messages = [];
  const listeners = new Map();
  const timers = new Map();
  let timerId = 0;
  const window = {
    location: { origin },
    ReactNativeWebView: { postMessage: postMessage ?? (data => messages.push(JSON.parse(data))) },
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    dispatchEvent(event) {
      for (const listener of listeners.get(event.type) ?? []) listener(event);
    },
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  };
  window.top = iframe ? {} : window;
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options?.detail; }
  }
  const app = {
    window, messages, listeners, timers,
    run(script) { new Function('window', 'CustomEvent', script)(window, CustomEvent); },
    install() { app.run(createWebShellAppContextBridgeScript(BASE)); },
    reply(requestId, context = CONTEXT) {
      app.run(createWebShellAppContextResponseScript(BASE, requestId, context));
    },
    expire() {
      for (const { callback } of Array.from(timers.values())) callback();
    },
  };
  return app;
}

test('metadata comes from embedded config and excludes secrets, account and device data', () => {
  assert.deepEqual(CONTEXT, {
    schemaVersion: 1, platform: 'ANDROID', appVersion: '1.0.0', versionCode: 5,
    environment: 'development', verification: 'client-signal',
  });
  assert.equal(createWebShellAppContext({ ...CONFIG, version: '1.2.3' }).appVersion, '1.2.3');
  assert.equal(createWebShellAppContext({ ...CONFIG, extra: { appVariant: 'production' } }).environment, 'production');
  for (const invalid of [null, {}, { ...CONFIG, version: '' }, { ...CONFIG, android: { versionCode: 0 } },
    { ...CONFIG, android: { versionCode: 1.2 } }, { ...CONFIG, extra: {} }]) {
    assert.equal(createWebShellAppContext(invalid), null);
  }
});

test('request parser accepts only versioned bounded requests with a correlation ID', () => {
  const request = { type: REQUEST_TYPE, schemaVersion: 1, requestId: 'document_12_1' };
  assert.deepEqual(parseWebShellAppContextRequest(JSON.stringify(request)), { requestId: request.requestId });
  for (const invalid of [null, {}, { ...request, schemaVersion: 2 }, { ...request, requestId: 1 },
    { ...request, requestId: '' }, { ...request, requestId: 'a'.repeat(97) },
    { ...request, requestId: '</script>' }, { ...request, type: 'other' }]) {
    assert.equal(parseWebShellAppContextRequest(JSON.stringify(invalid)), null);
  }
  assert.equal(parseWebShellAppContextRequest('{bad'), null);
  assert.equal(parseWebShellAppContextRequest(JSON.stringify({ ...request, unused: 'a'.repeat(512) })), null);
});

test('early/runtime installation is idempotent; concurrent requests receive their own native replies', async () => {
  const app = browser();
  app.install();
  const api = app.window.GachiGachaNative;
  app.install();
  assert.equal(app.window.GachiGachaNative, api);
  assert.equal(app.listeners.get(RESPONSE_EVENT).length, 1);
  assert.equal(api.schemaVersion, 1);
  const first = api.getAppContext();
  const second = api.getAppContext();
  assert.equal(app.messages.length, 2);
  assert.notEqual(app.messages[0].requestId, app.messages[1].requestId);
  app.reply(app.messages[1].requestId);
  app.reply(app.messages[0].requestId);
  assert.deepEqual(await first, CONTEXT);
  assert.deepEqual(await second, CONTEXT);
  assert.equal(app.timers.size, 0);
});

test('missing/throwing bridge and missing native response resolve null without blocking submission', async () => {
  const missing = browser();
  missing.install();
  delete missing.window.ReactNativeWebView;
  assert.equal(await missing.window.GachiGachaNative.getAppContext(), null);
  const throwing = browser({ postMessage() { throw new Error('bridge unavailable'); } });
  throwing.install();
  assert.equal(await throwing.window.GachiGachaNative.getAppContext(), null);
  assert.equal(throwing.timers.size, 0);
  const timeout = browser();
  timeout.install();
  const pending = timeout.window.GachiGachaNative.getAppContext();
  assert.equal(Array.from(timeout.timers.values())[0].delay, APP_CONTEXT_TIMEOUT_MS);
  timeout.expire();
  assert.equal(await pending, null);
  assert.equal(timeout.timers.size, 0);
});

test('wrong, stale and malformed replies cannot masquerade as a successful current response', async () => {
  const app = browser();
  app.install();
  const pending = app.window.GachiGachaNative.getAppContext();
  app.reply('old_document_1');
  assert.equal(app.timers.size, 1);
  app.window.dispatchEvent({ type: RESPONSE_EVENT, detail: { schemaVersion: 2, requestId: app.messages[0].requestId, context: CONTEXT } });
  assert.equal(app.timers.size, 1);
  app.reply(app.messages[0].requestId, { ...CONTEXT, verification: 'installed' });
  assert.equal(await pending, null);
  const next = app.window.GachiGachaNative.getAppContext();
  app.reply(app.messages[1].requestId, { ...CONTEXT, token: 'not-allowed' });
  assert.deepEqual(await next, CONTEXT);
});

test('API is absent on external origins/subframes and will not replace another namespace', () => {
  for (const options of [{ origin: 'https://example.org' }, { origin: 'http://dev.gachigacha.kro.kr' }, { iframe: true }]) {
    const app = browser(options);
    app.install();
    assert.equal(app.window.GachiGachaNative, undefined);
    assert.equal(app.listeners.size, 0);
  }
  const collision = browser();
  const previous = { schemaVersion: 2 };
  collision.window.GachiGachaNative = previous;
  collision.install();
  assert.equal(collision.window.GachiGachaNative, previous);
});

test('requests and responses recheck the live origin and top frame after navigation', async () => {
  const app = browser();
  app.install();
  const pending = app.window.GachiGachaNative.getAppContext();
  app.window.location.origin = 'https://example.org';
  app.reply(app.messages[0].requestId);
  assert.equal(app.timers.size, 1);
  assert.equal(await app.window.GachiGachaNative.getAppContext(), null);
  app.expire();
  assert.equal(await pending, null);
  app.window.location.origin = BASE;
  app.window.top = {};
  assert.equal(await app.window.GachiGachaNative.getAppContext(), null);
});

test('pagehide clears pending work, and repeated requests are bounded', async () => {
  const app = browser();
  app.install();
  const pending = Array.from({ length: 16 }, () => app.window.GachiGachaNative.getAppContext());
  assert.equal(await app.window.GachiGachaNative.getAppContext(), null);
  assert.equal(app.messages.length, 16);
  app.window.dispatchEvent({ type: 'pagehide' });
  assert.deepEqual(await Promise.all(pending), Array(16).fill(null));
  assert.equal(app.timers.size, 0);
  const afterReturn = app.window.GachiGachaNative.getAppContext();
  app.reply(app.messages[16].requestId);
  assert.deepEqual(await afterReturn, CONTEXT);
});

test('builders reject unsafe base URLs/IDs and escape embedded metadata', () => {
  for (const url of ['http://example.org', 'https://user:pass@example.org', 'https://example.org/path', 'https://example.org/?q=1']) {
    assert.throws(() => createWebShellAppContextBridgeScript(url));
    assert.throws(() => createWebShellAppContextResponseScript(url, 'a', CONTEXT));
  }
  assert.throws(() => createWebShellAppContextResponseScript(BASE, "');alert(1)", CONTEXT));
  assert.doesNotMatch(createWebShellAppContextResponseScript(BASE, 'a', { ...CONTEXT, appVersion: '</script>\u2028\u2029' }), /<\/script>|\u2028|\u2029/);
});

test('screen integration reads actual Expo config only after its existing trusted-origin gate', () => {
  const source = readFileSync(new URL('../src/screens/WebAppShellScreen.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(!isTrustedWebShellMessageSource\(appBaseUrl, sourceUrl\)\)[\s\S]*?return;[\s\S]*?parseWebShellAppContextRequest\(data\)/);
  assert.match(source, /isTrustedWebShellMessageSource\(appBaseUrl, topLevelUrlRef.current\)/);
  assert.match(source, /createWebShellAppContext\(Constants.expoConfig\)/);
  assert.equal((source.match(/createWebShellAppContextBridgeScript\(appBaseUrl\)/g) ?? []).length, 2);
});
