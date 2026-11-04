import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

import { createWebShellBackController } from '../src/domains/webShell/webShellBackController.ts';
import { createWebShellOverlayBackScript } from '../src/domains/webShell/webShellBackNavigation.ts';
import { parseWebShellMessage } from '../src/domains/webShell/webShellPolicy.ts';

// Execute the screen's real dispatch body, not a parallel test implementation.
// React Native is deliberately not imported: this is a bridge integration
// simulator, not a claim that a device/WebView instrumentation test was run.
const screenSource = readFileSync(new URL('../src/screens/WebAppShellScreen.tsx', import.meta.url), 'utf8');
const dispatchBody = screenSource.match(/dispatch\(requestId, expiresAt\) \{([\s\S]*?)\n      \},\n      onUnresponsive\(\)/)?.[1];
assert.ok(dispatchBody, 'screen Back dispatch must be exercised by this simulator');
const dispatchFactory = new Function('webViewRef', 'webViewLoadedRef', 'createWebShellOverlayBackScript',
  `return function dispatch(requestId, expiresAt) { ${dispatchBody} };`);

function createNativeBackHarness({ loaded = false, mounted = true, handled = true, deferAck = false, throwOnInject = false, throwAfterQueue = false, throwInPage = false } = {}) {
  const state = { injected: [], queuedScripts: [], messages: [], pageActions: 0, navigations: 0, unresponsive: 0 };
  let controller;
  const deliver = (raw) => {
    const message = parseWebShellMessage(raw);
    if (message?.type === 'overlay-back-result') controller.resolve(message.requestId, message.handled);
  };
  const window = {
    __gachigachaAndroidBackNavigation: {
      handle() {
        if (throwInPage) throw new Error('DOM unavailable');
        if (handled) state.pageActions++;
        return handled;
      },
    },
    ReactNativeWebView: {
      postMessage(raw) {
        state.messages.push(raw);
        if (!deferAck) deliver(raw);
      },
    },
  };
  const runPageScript = (script) => runInNewContext(script, { window, Date });
  const webViewRef = {
    current: mounted ? {
      injectJavaScript(script) {
        state.injected.push(script);
        if (throwOnInject) throw new Error('bridge unavailable');
        if (throwAfterQueue) {
          state.queuedScripts.push(script);
          throw new Error('native command queued before failure');
        }
        runPageScript(script);
      },
    } : null,
  };
  controller = createWebShellBackController({
    dispatch: dispatchFactory(webViewRef, { current: loaded }, createWebShellOverlayBackScript),
    onUnhandled() { state.navigations++; },
    onUnresponsive() { state.unresponsive++; },
  });
  return {
    state,
    press: () => controller.press(),
    cancel: () => controller.cancel(),
    flushAcknowledgements: () => state.messages.forEach(deliver),
    flushQueuedScripts: () => state.queuedScripts.splice(0).forEach(runPageScript),
  };
}

test('loaded=false still injects into the mounted WebView; handled ACK never navigates', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const app = createNativeBackHarness({ loaded: false });
  app.press();
  assert.equal(app.state.injected.length, 1);
  assert.equal(app.state.pageActions, 1);
  assert.equal(app.state.navigations, 0);
  t.mock.timers.tick(1_000);
  assert.equal(app.state.navigations, 0);
  assert.equal(app.state.unresponsive, 0);
});

test('only an explicit unhandled ACK navigates once, including before load-end', () => {
  const app = createNativeBackHarness({ loaded: false, handled: false, deferAck: true });
  app.press();
  app.press();
  assert.equal(app.state.injected.length, 1);
  assert.equal(app.state.navigations, 0);
  app.flushAcknowledgements();
  app.flushAcknowledgements();
  assert.equal(app.state.navigations, 1);
  app.cancel();
});

test('a closed overlay with a delayed ACK cannot fall through after timeout', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const app = createNativeBackHarness({ deferAck: true });
  app.press();
  assert.equal(app.state.pageActions, 1);
  t.mock.timers.tick(500);
  assert.equal(app.state.unresponsive, 1);
  app.flushAcknowledgements();
  assert.equal(app.state.navigations, 0);
});

test('a missing WebView keeps the explicit unavailable-view fallback', () => {
  const app = createNativeBackHarness({ mounted: false });
  app.press();
  assert.equal(app.state.injected.length, 0);
  assert.equal(app.state.navigations, 1);
  app.cancel();
});

test('a page-side adapter error is acknowledged as consumed, not unhandled', () => {
  const app = createNativeBackHarness({ throwInPage: true });
  app.press();
  assert.equal(app.state.messages.length, 1);
  assert.equal(JSON.parse(app.state.messages[0]).handled, true);
  assert.equal(app.state.navigations, 0);
  app.cancel();
});

test('a thrown bridge dispatch is not evidence that the page had no overlay', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const app = createNativeBackHarness({ throwOnInject: true });
  app.press();
  t.mock.timers.tick(500);
  assert.equal(app.state.navigations, 0);
  assert.equal(app.state.unresponsive, 1);
});

test('a bridge exception after enqueue cannot both close the overlay and navigate', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const app = createNativeBackHarness({ throwAfterQueue: true });
  app.press();
  app.flushQueuedScripts();
  assert.equal(app.state.pageActions, 1);
  assert.equal(app.state.navigations, 0);
  t.mock.timers.tick(500);
  assert.equal(app.state.unresponsive, 1);
});
