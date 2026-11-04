import assert from 'node:assert/strict';
import test from 'node:test';

import { createWebShellRouteScrollScript } from '../src/domains/webShell/webShellRouteScroll.ts';

// Exercise the injected script, its event ordering and actual scroll effects.
// Real Chromium layout/DOM coverage lives in web-shell-browser.test.mjs.
function createPage(path = '/trade', contentPath = path) {
  const events = new Map();
  const documentEvents = new Map();
  const frames = new Map();
  const timers = new Map();
  const observers = [];
  let nextFrame = 0;
  let content;
  let y = 1200;
  const scrolls = [];
  const root = { scrollTop: y, scrollLeft: 0, scrollHeight: 4000 };
  const location = new URL(path, 'https://dev.gachigacha.kro.kr');
  const register = (map, type, listener) => {
    if (!map.has(type)) map.set(type, []);
    map.get(type).push(listener);
  };
  const window = {
    location,
    innerHeight: 800,
    get scrollY() { return y; },
    history: {
      state: { key: 'initial', idx: 0, usr: { untouched: true } },
      scrollRestoration: 'auto',
      pushState(state, _title, path) {
        this.state = state;
        if (path !== undefined) location.href = new URL(path, location).href;
      },
      replaceState(state, _title, path) {
        this.state = state;
        if (path !== undefined) location.href = new URL(path, location).href;
      },
    },
    setTimeout(callback) { const id = ++nextFrame; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
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
      if (selector === 'main form#trade-create-form') {
        return content.path === '/trade/new' ? content : null;
      }
      if (selector === 'main > section[aria-live="polite"]') {
        return ['/trade', '/mypage/trades'].includes(content.path) ? content : null;
      }
      if (selector === 'main nav[aria-label="내 교환글 상태 필터"]') {
        return content.path === '/mypage/trades' ? content : null;
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
  const setContent = (path, options = {}) => {
    const { count = 2, loading = false, error = false, more = null, anchors = false } = options;
    content = path ? {
      path, loading, error, more,
      cards: Array.from({ length: count }, (_, index) => ({
        getAttribute() { return `/trade/${index + 1}`; },
        getBoundingClientRect() {
          // Most tests isolate absolute restoration. Anchor cases opt in.
          const top = anchors ? 100 + index * 200 - y : -10000;
          return { top, bottom: top + 180 };
        },
      })),
      querySelector(selector) {
        if (selector.includes('[role="status"]') && this.loading) return {};
        if (selector.includes('[role="alert"]') && this.error) return {};
        return null;
      },
      querySelectorAll(selector) {
        return selector === 'a[href]' ? this.cards : this.more ? [this.more] : [];
      },
    } : null;
    for (const observer of observers) observer();
  };
  const setScroll = top => {
    y = top;
    root.scrollTop = top;
    dispatch('scroll');
  };
  const frame = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback();
  };
  setContent(contentPath);
  run();
  return {
    window, root, scrolls, run, dispatch, setContent, setScroll, frame,
    get y() { return y; },
    get observerCount() { return observers.length; },
    get content() { return content; },
    expire() { for (const callback of [...timers.values()]) callback(); },
    mutate() { for (const observer of observers) observer(); },
    settle() { for (let index = 0; index < 5; index += 1) frame(); },
    navigate(path, method = 'pushState', state = {}) {
      window.history[method](state, '', path);
    },
    pop(path, state = {}) {
      location.href = new URL(path, location).href;
      window.history.state = state;
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

test('create and my-trades entries start at top only after their own content appears', () => {
  for (const [from, to] of [['/trade', '/trade/new'], ['/mypage', '/mypage/trades']]) {
    const page = createPage(from);
    page.navigate(to);
    page.settle();
    assert.equal(page.y, 1200);
    page.setContent(to);
    page.settle();
    assert.equal(page.y, 0);
  }
});

test('saved list POP retries after short loading DOM clamps native restoration to zero', () => {
  for (const path of ['/trade', '/mypage/trades']) {
    const page = createPage(path);
    page.settle();
    const state = page.window.history.state;
    page.setScroll(1250);
    page.navigate('/trade/42', 'pushState', { key: 'detail', idx: 1 });
    page.setContent('/trade/42');
    page.settle();
    page.pop(path, state);
    page.root.scrollHeight = 600;
    page.setContent(path, { loading: true, count: 0 });
    page.setScroll(0);
    page.settle();
    assert.equal(page.y, 0);
    page.setContent(path);
    page.settle();
    assert.equal(page.y, 0, 'Ready DOM without sufficient height still waits');
    page.root.scrollHeight = 4000;
    page.dispatch('resize');
    page.settle();
    assert.equal(page.y, 1250);
    assert.equal(page.window.history.scrollRestoration, 'auto');
  }
});

test('React Router keys isolate repeated URLs and keep usr/key/idx untouched', () => {
  const page = createPage('/trade?keyword=toy');
  page.setContent('/trade');
  const first = page.window.history.state;
  page.setScroll(1250);
  const second = { key: 'second-list', idx: 1, usr: { arbitrary: 'keep' } };
  page.navigate('/trade?keyword=toy', 'pushState', second);
  page.setContent('/trade');
  page.setScroll(650);
  page.navigate('/trade/42', 'pushState', { key: 'detail', idx: 2 });
  page.setContent('/trade/42');
  page.settle();
  for (const [state, expected] of [[first, 1250], [second, 650]]) {
    page.pop('/trade?keyword=toy', state);
    page.setContent('/trade', { loading: true });
    page.setScroll(0);
    page.setContent('/trade');
    page.settle();
    assert.equal(page.y, expected);
    assert.equal(page.window.history.state, state);
  }
  assert.deepEqual(second, { key: 'second-list', idx: 1, usr: { arbitrary: 'keep' } });
});

test('query fallback entries restore independently without applying top reset to filter changes', () => {
  const page = createPage('/trade?keyword=one');
  page.window.history.replaceState({}, '');
  page.setContent('/trade');
  page.setScroll(1250);
  page.navigate('/trade?keyword=two');
  page.setContent('/trade');
  assert.equal(page.y, 1250);
  page.setScroll(650);
  page.navigate('/trade/42');
  page.setContent('/trade/42');
  page.settle();
  for (const [query, expected] of [['one', 1250], ['two', 650]]) {
    page.pop(`/trade?keyword=${query}`);
    page.setContent('/trade', { loading: true });
    page.setScroll(0);
    page.setContent('/trade');
    page.settle();
    assert.equal(page.y, expected);
  }
});

test('Router bootstrap replaceState without URL preserves a pending correction', () => {
  const page = createPage('/trade/new', null);
  const state = { key: 'bootstrap', idx: 0, usr: { custom: 1 } };
  page.window.history.replaceState(state, '');
  assert.equal(page.window.location.pathname, '/trade/new');
  page.setContent('/trade/new');
  page.settle();
  assert.equal(page.y, 0);
  assert.equal(page.window.history.state, state);
});

function preparePaginatedReturn(path = '/trade', count = 40) {
  const page = createPage(path);
  page.settle();
  page.setContent(path, { count });
  const state = page.window.history.state;
  page.setScroll(1800);
  page.navigate('/trade/42');
  page.setContent('/trade/42');
  page.settle();
  page.pop(path, state);
  page.setContent(path, { loading: true, count: 0 });
  page.setScroll(0);
  return page;
}

test('POP rehydrates loaded pages through only the existing scoped read-only more button', () => {
  for (const [path, text, pageSize] of [['/trade', '더보기', 20], ['/mypage/trades', '교환글 더보기', 10]]) {
    const page = preparePaginatedReturn(path, pageSize * 2);
    let clicks = 0;
    const more = {
      textContent: text, disabled: false,
      click() { clicks += 1; this.disabled = true; this.textContent = '불러오는 중...'; },
    };
    page.setContent(path, { count: pageSize, more });
    page.mutate();
    page.settle();
    assert.equal(clicks, 1);
    assert.equal(page.y, 0);
    more.disabled = false;
    more.textContent = text;
    page.setContent(path, { count: pageSize * 2, more });
    page.settle();
    assert.equal(page.y, 1800);
    assert.equal(clicks, 1);
    page.mutate();
    page.settle();
    assert.equal(clicks, 1, 'A completed restore never continues pagination');
  }
});

test('pagination stops on no progress, errors, gestures and expiry without later retries', () => {
  for (const reason of ['no-progress', 'error', 'gesture', 'expiry']) {
    const page = preparePaginatedReturn();
    let clicks = 0;
    const more = {
      textContent: '더보기', disabled: false,
      click() { clicks += 1; this.disabled = true; this.textContent = '불러오는 중...'; },
    };
    page.setContent('/trade', { count: 20, more });
    page.mutate(); // Observe the busy state before simulating settlement.
    if (reason === 'gesture') page.dispatch('touchstart');
    if (reason === 'expiry') page.expire();
    more.disabled = false;
    more.textContent = '더보기';
    page.setContent('/trade', { count: 20, more, error: reason === 'error' });
    page.settle();
    page.setContent('/trade', { count: 40, more });
    page.settle();
    assert.equal(page.y, 0, reason);
    assert.equal(clicks, 1, reason);
  }
});

test('new list entries never auto-load pages and deleted cards clamp to the actual final height', () => {
  const page = preparePaginatedReturn();
  page.root.scrollHeight = 1200;
  page.setContent('/trade', { count: 10 });
  page.settle();
  assert.equal(page.y, 400);
  let clicks = 0;
  page.navigate('/trade?keyword=new');
  page.setContent('/trade', { count: 20, more: { textContent: '더보기', disabled: false, click() { clicks += 1; } } });
  page.settle();
  assert.equal(clicks, 0);
});

test('saved visible card anchors compensate for changed content height above the card', () => {
  const page = createPage();
  page.setContent('/trade', { count: 20, anchors: true });
  page.setScroll(1250);
  const state = page.window.history.state;
  page.navigate('/trade/42');
  page.setContent('/trade/42');
  page.settle();
  page.pop('/trade', state);
  page.setContent('/trade', { loading: true });
  page.setScroll(0);
  page.setContent('/trade', { count: 20, anchors: true });
  for (const card of page.content.cards) {
    const original = card.getBoundingClientRect;
    card.getBoundingClientRect = () => {
      const rect = original();
      return { top: rect.top + 100, bottom: rect.bottom + 100 };
    };
  }
  page.settle();
  assert.equal(page.y, 1350);
});

test('my-trades top entry waits through loading but persisted list pages keep native position', () => {
  const page = createPage('/mypage');
  page.navigate('/mypage/trades');
  page.setContent('/mypage/trades', { loading: true });
  page.settle();
  assert.equal(page.y, 1200);
  page.setContent('/mypage/trades');
  page.settle();
  assert.equal(page.y, 0);
  page.setScroll(1400);
  page.dispatch('pageshow', { persisted: true });
  page.settle();
  assert.equal(page.y, 1400);
});

test('same URL replacement with a new Router key migrates a pending list restore safely', () => {
  const page = preparePaginatedReturn('/trade', 2);
  const state = { key: 'replacement', idx: 0, usr: { custom: 'unchanged' } };
  page.window.history.replaceState(state, '');
  page.setContent('/trade');
  page.settle();
  assert.equal(page.y, 1800);
  assert.equal(page.window.history.state, state);
});
