import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyWebShellNavigation,
  createWebShellBootstrapScript,
  createWebShellNavigationScript,
  createWebShellRuntimeScript,
  createWebShellSessionSyncScript,
  isTrustedWebShellMessageSource,
  parseWebShellMessage,
} from '../src/domains/webShell/webShellPolicy.ts';

const APP_BASE_URL = 'https://dev.gachigacha.kro.kr';

function runSessionSyncScript(script, initialEntries) {
  const entries = new Map(Object.entries(initialEntries));
  const operations = [];
  let reloadCount = 0;
  const window = {
    location: {
      reload() {
        reloadCount += 1;
      },
    },
    sessionStorage: {
      getItem(key) {
        return entries.get(key) ?? null;
      },
      removeItem(key) {
        operations.push(['remove', key]);
        entries.delete(key);
      },
      setItem(key, value) {
        operations.push(['set', key, value]);
        entries.set(key, value);
      },
    },
  };

  new Function('window', script)(window);
  return { entries, operations, reloadCount };
}

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
  const syncScript = createWebShellSessionSyncScript(tokens);
  const guestSyncScript = createWebShellSessionSyncScript(null);
  const runtimeScript = createWebShellRuntimeScript();

  assert.match(bootstrapScript, /gachi-gacha:access-token/);
  assert.match(bootstrapScript, /data-gachigacha-android-apple-login/);
  assert.match(runtimeScript, /data-gachigacha-android-map-header/);
  assert.match(runtimeScript, /data-gachigacha-android-map-research/);
  assert.match(runtimeScript, /data-gachigacha-android-map-controls/);
  assert.match(runtimeScript, /data-gachigacha-android-map-status/);
  assert.match(runtimeScript, /data-gachigacha-android-map-list-area/);
  assert.match(runtimeScript, /현재 지원 지역/);
  assert.match(runtimeScript, /--gachigacha-android-map-research-top/);
  assert.match(runtimeScript, /--gachigacha-android-map-controls-bottom/);
  assert.match(runtimeScript, /gachigacha-android-dismiss-location-error/);
  assert.match(runtimeScript, /data-gachigacha-android-chat-main/);
  assert.match(runtimeScript, /data-gachigacha-android-chat-composer/);
  assert.match(runtimeScript, /전체 대화/);
  assert.match(runtimeScript, /data-gachigacha-android-avatar-fallback/);
  assert.match(runtimeScript, /gachigachaAndroidAvatarFallbackImage/);
  assert.match(runtimeScript, /data:image\/svg\+xml/);
  assert.doesNotMatch(runtimeScript, /%3Crect/);
  assert.match(runtimeScript, /bottom: 12px/);
  assert.match(bootstrapScript, /gachigacha:auth-refresh-token/);
  assert.doesNotMatch(bootstrapScript, /<\/script>/);
  assert.match(syncScript, /sessionChanged/);
  assert.match(syncScript, /window\.location\.reload/);
  assert.match(guestSyncScript, /removeItem/);
  assert.doesNotMatch(syncScript, /<\/script>/);
  assert.doesNotThrow(() => new Function(bootstrapScript));
  assert.doesNotThrow(() => new Function(runtimeScript));
  assert.doesNotThrow(() => new Function(syncScript));
});

test('푸시 딥링크는 교환글과 채팅방 숫자 경로만 허용한다', () => {
  const tradeScript = createWebShellNavigationScript('/trade/37');
  const chatScript = createWebShellNavigationScript('/chat/12');

  assert.match(tradeScript, /window\.location\.assign/);
  assert.match(tradeScript, /"\/trade\/37"/);
  assert.match(chatScript, /"\/chat\/12"/);
  assert.throws(() => createWebShellNavigationScript('/login'));
  assert.throws(() => createWebShellNavigationScript('/trade/1?next=javascript:1'));
});

test('WebView 세션은 실제 토큰이 다를 때만 갱신하고 한 번 다시 로드한다', () => {
  const tokens = {
    accessToken: 'current-access',
    refreshToken: 'current-refresh',
  };
  const matching = runSessionSyncScript(
    createWebShellSessionSyncScript(tokens),
    {
      'gachi-gacha:access-token': tokens.accessToken,
      'gachi-gacha:refresh-token': tokens.refreshToken,
    },
  );

  assert.equal(matching.reloadCount, 0);
  assert.deepEqual(matching.operations, []);

  const stale = runSessionSyncScript(createWebShellSessionSyncScript(tokens), {
    'gachi-gacha:access-token': 'stale-access',
    'gachi-gacha:refresh-token': 'stale-refresh',
  });

  assert.equal(stale.reloadCount, 1);
  assert.equal(
    stale.entries.get('gachi-gacha:refresh-token'),
    tokens.refreshToken,
  );

  const guest = runSessionSyncScript(createWebShellSessionSyncScript(null), {
    'gachi-gacha:access-token': tokens.accessToken,
    'gachi-gacha:refresh-token': tokens.refreshToken,
  });

  assert.equal(guest.reloadCount, 1);
  assert.equal(guest.entries.size, 0);
});
