import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyWebShellNavigation,
  createWebShellBootstrapScript,
  createWebShellSessionReloadScript,
  isTrustedWebShellMessageSource,
  parseWebShellMessage,
} from '../src/domains/webShell/webShellPolicy.ts';

const APP_BASE_URL = 'https://dev.gachigacha.kro.kr';

test('같은 HTTPS origin의 모든 웹 화면을 WebView 안에서 연다', () => {
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, `${APP_BASE_URL}/trade/37?from=app`),
    { type: 'allow' },
  );
  assert.equal(
    isTrustedWebShellMessageSource(APP_BASE_URL, `${APP_BASE_URL}/mypage`),
    true,
  );
});

test('카카오·네이버 로그인만 네이티브 OAuth로 전달하고 Apple은 막는다', () => {
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, `${APP_BASE_URL}/api/v1/oauth/kakao`),
    { provider: 'kakao', type: 'native-oauth' },
  );
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, `${APP_BASE_URL}/api/v1/oauth/naver`),
    { provider: 'naver', type: 'native-oauth' },
  );
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, `${APP_BASE_URL}/api/v1/oauth/apple`),
    { type: 'unsupported-oauth' },
  );
});

test('외부 HTTPS 링크는 브라우저로 보내고 위장 origin과 위험 scheme은 거부한다', () => {
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, 'https://brand.naver.com/item/1'),
    { type: 'external' },
  );
  assert.deepEqual(
    classifyWebShellNavigation(
      APP_BASE_URL,
      'https://dev.gachigacha.kro.kr.attacker.example/trade',
    ),
    { type: 'external' },
  );
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, 'javascript:alert(1)'),
    { type: 'block' },
  );
  assert.equal(
    isTrustedWebShellMessageSource(
      APP_BASE_URL,
      'https://dev.gachigacha.kro.kr.attacker.example/trade',
    ),
    false,
  );
});

test('허용된 네이티브 브리지 메시지만 파싱한다', () => {
  assert.deepEqual(
    parseWebShellMessage(
      JSON.stringify({
        type: 'gachigacha:auth-refresh-token',
        token: ' rotated-refresh ',
      }),
    ),
    { token: 'rotated-refresh', type: 'auth-refresh-token' },
  );
  assert.deepEqual(
    parseWebShellMessage(
      JSON.stringify({
        type: 'gachigacha:auth-refresh-token',
        token: null,
      }),
    ),
    { token: null, type: 'auth-refresh-token' },
  );
  assert.equal(
    parseWebShellMessage(JSON.stringify({ type: 'run-native-command' })),
    null,
  );
});

test('세션 주입 스크립트는 토큰을 저장하고 HTML 종료 문자열을 이스케이프한다', () => {
  const tokens = {
    accessToken: 'access</script><script>alert(1)</script>',
    refreshToken: 'refresh-token',
  };
  const bootstrapScript = createWebShellBootstrapScript(tokens);
  const reloadScript = createWebShellSessionReloadScript(tokens);

  assert.match(bootstrapScript, /gachi-gacha:access-token/);
  assert.match(bootstrapScript, /data-apple-sign-in/);
  assert.equal(bootstrapScript.includes('/api/v1/oauth/apple'), true);
  assert.match(bootstrapScript, /gachigacha:auth-refresh-token/);
  assert.doesNotMatch(bootstrapScript, /<\/script>/);
  assert.match(reloadScript, /window\.location\.reload/);
  assert.doesNotMatch(reloadScript, /<\/script>/);
});
