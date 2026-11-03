import assert from 'node:assert/strict';
import test from 'node:test';

import { createWebShellRouteScrollScript } from '../src/domains/webShell/webShellRouteScroll.ts';

// Exercise the injected script, its event ordering and actual scroll effects.
// Real Chromium layout/DOM coverage lives in web-shell-browser.test.mjs.
function createPage(path = '/trade', contentPath = path) {
  const events = new Map();
  const documentEvents = new Map();
  const frames = new Map();
  const observers = [];
  let nextFrame = 0;
  let content = contentPath ? { path: contentPath } : null;
  let y = 1200;
  const scrolls = [];
  const root = { scrollTop: y, scrollLeft: 0 };
  const location = new URL(path, 'https://dev.gachigacha.kro.kr');
  const register = (map, type, listener) => {
    if (!map.has(type)) map.set(type, []);
    map.get(type).push(listener);
  };
  const window = {
    location,
    get scrollY() { return y; },
    history: {
      scrollRestoration: 'auto',
      pushState(_state, _title, path) { location.href = new URL(path, location).href; },
      replaceState(_state, _title, path) { location.href = new URL(path, location).href; },
    },
    requestAnimationFrame(callback) {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(type, listener) { register(events, type, listener); },
    scrollTo({ top }) {
      y = top;
      root.scrollTop = top;
      scrolls.push(top);
    },
  };
  const document = {
    documentElement: {},
    scrollingElement: root,
    addEventListener(type, listener) { register(documentEvents, type, listener); },
    querySelector(selector) {
      if (!content) return null;
      if (selector === '[aria-label="서비스 업데이트 목록"]') {
        return content.path === '/updates' ? content : null;
      }
      if (selector === 'main form#trade-edit-form') {
        return /^\/trade\/\d+\/edit$/.test(content.path) ? content : null;
      }
      if (selector === 'main #trade-comments-title') {
        return /^\/trade\/\d+$/.test(content.path) ? content : null;
      }
      return null;
    },
  };
  class MutationObserver {
    constructor(callback) { observers.push(callback); }
    observe() {}
  }
  const run = () => new Function('window', 'document', 'MutationObserver', createWebShellRouteScrollScript())(window, document, MutationObserver);
  const dispatch = (type, event = {}) => {
    for (const listener of events.get(type) ?? []) listener(event);
  };
  const setContent = path => {
    content = path ? { path } : null;
    for (const observer of observers) observer();
  };
  const setScroll = top => { y = top; root.scrollTop = top; };
  const frame = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback();
  };
  run();
  return {
    window, root, scrolls, run, dispatch, setContent, setScroll, frame,
    get y() { return y; },
    get observerCount() { return observers.length; },
    settle() { for (let index = 0; index < 5; index += 1) frame(); },
    navigate(path, method = 'pushState') {
      window.history[method]({}, '', path);
    },
    pop(path) {
      location.href = new URL(path, location).href;
      dispatch('popstate');
    },
  };
}

test('list → non-owner detail, detail → edit and edit → detail start at the top', () => {
  const page = createPage();
  for (const path of ['/trade/42', '/trade/42/edit', '/trade/42']) {
    page.setScroll(1400);
    page.navigate(path);
    page.setContent(null);
    page.settle();
    assert.equal(page.y, 1400, 'Loading content does not trigger an early reset');
    page.setContent(path);
    page.settle();
    assert.equal(page.y, 0, `${path} starts at the top without an owner edit link`);
  }
});

test('a previous detail cannot be mistaken for the next detail before React commits', () => {
  const page = createPage('/trade/42');
  page.settle();
  page.setScroll(900);
  page.navigate('/trade/99');
  page.settle();
  assert.equal(page.y, 900);
  page.setContent('/trade/99');
  page.settle();
  assert.equal(page.y, 0);
});

test('readiness is checked again if loading replaces the page between animation frames', () => {
  const page = createPage();
  page.navigate('/trade/42');
  page.setContent('/trade/42');
  page.frame();
  page.setContent(null);
  page.settle();
  assert.equal(page.y, 1200);
  page.setContent('/trade/42');
  page.settle();
  assert.equal(page.y, 0);
});

test('popstate reset wins over restoration after the event and after the first reset', () => {
  const page = createPage('/trade/42/edit');
  page.settle();
  page.setScroll(1500);
  page.pop('/trade/42');
  page.setContent('/trade/42');
  page.frame();
  page.setScroll(800); // Browser restoration after popstate listeners.
  page.frame();
  assert.equal(page.y, 0);
  page.setScroll(600); // A later restore queued during the first frame.
  page.frame();
  assert.equal(page.y, 0);
  page.setScroll(500);
  page.setContent('/trade/42');
  page.settle();
  assert.equal(page.y, 500, 'Later rendering never resets the same page again');
});

test('detail → list preserves browser restoration and same-route list filters', () => {
  const page = createPage('/trade/42');
  page.settle();
  const count = page.scrolls.length;
  page.pop('/trade?keyword=toy');
  page.setContent('/trade');
  page.setScroll(1700);
  page.settle();
  assert.equal(page.y, 1700);
  page.navigate('/trade?keyword=toy&sort=latest', 'replaceState');
  page.setContent('/trade');
  page.settle();
  assert.equal(page.y, 1700);
  assert.equal(page.scrolls.length, count);
  assert.equal(page.window.history.scrollRestoration, 'auto');
});

test('initial entries, replaceState and BFCache restoration also reset eligible pages', () => {
  for (const path of ['/trade/42', '/trade/42/edit', '/updates']) {
    const page = createPage(path, null);
    page.settle();
    assert.equal(page.y, 1200);
    page.setContent(path);
    page.settle();
    assert.equal(page.y, 0);
    page.setScroll(600);
    page.dispatch('pageshow', { persisted: true });
    page.settle();
    assert.equal(page.y, 0);
  }
  const page = createPage('/mypage');
  page.navigate('/updates', 'replaceState');
  page.setContent('/updates');
  page.settle();
  assert.equal(page.y, 0);
});

test('hashes, another route and deliberate input cancel pending corrections', () => {
  for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown']) {
    const page = createPage();
    page.navigate('/trade/42');
    page.dispatch(event);
    page.setContent('/trade/42');
    page.settle();
    assert.equal(page.y, 1200, event);
  }
  const page = createPage();
  page.navigate('/trade/42');
  page.setContent('/trade/42');
  page.navigate('/trade/42#trade-comments-title', 'replaceState');
  page.settle();
  assert.equal(page.y, 1200);
  page.navigate('/updates');
  page.navigate('/mypage');
  page.setContent('/updates');
  page.settle();
  assert.equal(page.y, 1200);
});

test('a gesture after the first reset cancels its bounded follow-up', () => {
  const page = createPage('/trade/42');
  page.frame();
  page.frame();
  assert.equal(page.y, 0);
  page.dispatch('touchstart');
  page.setScroll(300);
  page.settle();
  assert.equal(page.y, 300);
});

test('repeated runtime injection does not install another history wrapper or observer', () => {
  const page = createPage();
  const pushState = page.window.history.pushState;
  page.run();
  assert.equal(page.window.history.pushState, pushState);
  assert.equal(page.observerCount, 1);
});

test('document root is corrected if window.scrollTo leaves its offset behind', () => {
  const page = createPage('/trade/42');
  page.window.scrollTo = () => {};
  page.root.scrollLeft = 25;
  page.settle();
  assert.equal(page.root.scrollTop, 0);
  assert.equal(page.root.scrollLeft, 0);
});
