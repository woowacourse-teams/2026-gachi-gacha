import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWebShellBootstrapScript,
  createWebShellFilePickerScript,
  createWebShellRuntimeScript,
} from '../src/domains/webShell/webShellPolicy.ts';

function setup() {
  const listeners = [];
  const window = {};
  const document = {
    addEventListener(type, listener, capture) {
      listeners.push({ type, listener, capture });
    },
  };
  class Input {
    constructor(type, inDialog = true) {
      this.type = type;
      this.inDialog = inDialog;
    }
    closest(selector) {
      assert.equal(selector, 'dialog, [role="dialog"], [role="alertdialog"]');
      return this.inDialog ? {} : null;
    }
  }
  const install = () => new Function('window', 'document', 'HTMLInputElement',
    createWebShellFilePickerScript())(window, document, Input);
  install();
  const dispatch = (target) => {
    let stopped = 0;
    const event = {
      target,
      stopPropagation() { stopped += 1; },
      preventDefault() { assert.fail('Do not cancel a file-picker default action'); },
    };
    for (const entry of listeners) entry.listener(event);
    return stopped;
  };
  return { listeners, install, dispatch, Input };
}

test('파일 선택 취소만 React 부모 dialog보다 먼저 차단한다', () => {
  const { listeners, dispatch, Input } = setup();
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, 'cancel');
  assert.equal(listeners[0].capture, true);
  assert.equal(dispatch(new Input('file')), 1);
});

test('진짜 dialog 취소와 일반 입력 및 dialog 밖의 파일 취소는 변경하지 않는다', () => {
  const { dispatch, Input } = setup();
  assert.equal(dispatch({ tagName: 'DIALOG' }), 0);
  assert.equal(dispatch(new Input('text')), 0);
  assert.equal(dispatch(new Input('file', false)), 0);
  assert.equal(dispatch(null), 0);
});

test('반복 주입에도 한 번만 등록하고 나중에 생성된 파일 입력도 처리한다', () => {
  const { listeners, install, dispatch, Input } = setup();
  install();
  install();
  assert.equal(listeners.length, 1);
  assert.equal(dispatch(new Input('file')), 1);
});

test('bootstrap과 document-end 모두 파일 취소 보호를 설치한다', () => {
  for (const script of [createWebShellBootstrapScript(null), createWebShellRuntimeScript()]) {
    assert.ok(script.includes(createWebShellFilePickerScript()));
    assert.ok(script.indexOf(createWebShellFilePickerScript()) < script.indexOf('__gachigachaAndroidBackNavigation'));
  }
});
