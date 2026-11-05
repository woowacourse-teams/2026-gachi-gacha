import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ANDROID_TRADE_FORM_STYLES,
  createWebShellTradeFormPresentationScript,
} from '../src/domains/webShell/webShellTradeForm.ts';
import { createWebShellRuntimeScript } from '../src/domains/webShell/webShellPolicy.ts';

function setup(pathname = '/trade/new') {
  const listeners = [];
  const list = { hasAttribute: () => true };
  const form = { contains: (element) => element === list };
  const forms = { 'trade-create-form': form, 'trade-edit-form': form };
  const window = {
    location: { pathname },
    mobile: true,
    matchMedia() { return { matches: this.mobile }; },
  };
  const document = {
    addEventListener(type, listener, capture) { listeners.push({ type, listener, capture }); },
    getElementById: (id) => forms[id],
  };
  class Element {
    constructor({ interactive = false, photo = true } = {}) {
      this.interactive = interactive;
      this.photo = photo;
    }
    closest(selector) {
      if (selector === '[data-trade-photo-index]') return this.photo ? { parentElement: list } : null;
      if (selector === 'button, [data-gachigacha-android-photo-handle]') return this.interactive ? {} : null;
      assert.fail(`Unexpected selector: ${selector}`);
    }
  }
  const install = () => new Function('window', 'document', 'Element',
    createWebShellTradeFormPresentationScript())(window, document, Element);
  install();
  const dispatch = (overrides = {}) => {
    let stopped = 0;
    const event = {
      target: new Element(), pointerType: 'touch', isPrimary: true,
      stopPropagation() { stopped += 1; },
      preventDefault() { assert.fail('Native scrolling must keep its default action'); },
      ...overrides,
    };
    listeners.forEach(({ listener }) => listener(event));
    return stopped;
  };
  return { window, list, form, Element, listeners, install, dispatch };
}

test('touch/pen 사진 본문만 React 정렬 시작에서 분리하며 기본 스크롤은 취소하지 않는다', () => {
  const { dispatch, listeners } = setup();
  assert.equal(dispatch(), 1);
  assert.equal(dispatch({ pointerType: 'pen' }), 1);
  assert.equal(listeners[0].type, 'pointerdown');
  assert.equal(listeners[0].capture, true);
  assert.equal(listeners.length, 1); // Never intercept move/up/cancel cleanup.
});

test('손잡이·삭제 버튼·마우스·보조 터치·일반 요소는 원래 이벤트를 유지한다', () => {
  const { dispatch, Element } = setup();
  assert.equal(dispatch({ target: new Element({ interactive: true }) }), 0);
  assert.equal(dispatch({ pointerType: 'mouse' }), 0);
  assert.equal(dispatch({ isPrimary: false }), 0);
  assert.equal(dispatch({ target: new Element({ photo: false }) }), 0);
  assert.equal(dispatch({ target: null }), 0);
});

test('반복 주입은 capture listener를 중복 등록하지 않는다', () => {
  const { install, listeners, dispatch } = setup();
  install();
  install();
  assert.equal(listeners.length, 1);
  assert.equal(dispatch(), 1);
});

test('작성·수정 경로의 현재 form 안에서만 동작하고 SPA 경로를 매번 확인한다', () => {
  const { window, form, list, dispatch } = setup();
  for (const pathname of ['/trade/new', '/trade/new/', '/trade/15/edit', '/trade/15/edit/']) {
    window.location.pathname = pathname;
    assert.equal(dispatch(), 1, pathname);
  }
  for (const pathname of ['/trade', '/trade/15', '/trade/newspaper', '/trade/abc/edit', '/chat']) {
    window.location.pathname = pathname;
    assert.equal(dispatch(), 0, pathname);
  }
  window.location.pathname = '/trade/new';
  window.mobile = false;
  assert.equal(dispatch(), 0);
  window.mobile = true;
  list.hasAttribute = () => false;
  assert.equal(dispatch(), 0);
  list.hasAttribute = () => true;
  form.contains = () => false;
  assert.equal(dispatch(), 0);
});

test('런타임에 폼 adapter를 통합하고 안전 영역을 중복 더하지 않는다', () => {
  const script = createWebShellRuntimeScript();
  assert.ok(script.includes(createWebShellTradeFormPresentationScript()));
  assert.ok(script.includes('markTradeFormPresentation();'));
  assert.doesNotThrow(() => new Function(script));
  assert.match(ANDROID_TRADE_FORM_STYLES, /padding: 24px !important/);
  assert.ok(ANDROID_TRADE_FORM_STYLES.indexOf('padding: 24px !important') <
    ANDROID_TRADE_FORM_STYLES.indexOf('@media'), 'Action padding must survive rotation/tablet width');
  assert.doesNotMatch(ANDROID_TRADE_FORM_STYLES, /safe-area-inset|padding-bottom/);
  assert.match(ANDROID_TRADE_FORM_STYLES, /touch-action: auto !important/);
  assert.match(ANDROID_TRADE_FORM_STYLES, /min-height: 44px/);
});
