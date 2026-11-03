import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createWebShellBackController } from '../src/domains/webShell/webShellBackController.ts';

import {
  classifyWebShellNavigation,
  createWebShellAuthenticationCompletionScript,
  createWebShellApiCompatibilityScript,
  createWebShellBootstrapScript,
  createWebShellChatListNavigationScript,
  createWebShellNavigationScript,
  createWebShellOverlayBackScript,
  createWebShellRuntimeScript,
  createWebShellSameOriginNavigationScript,
  createWebShellSessionSyncScript,
  isTrustedWebShellMessageSource,
  parseWebShellMessage,
} from '../src/domains/webShell/webShellPolicy.ts';

const APP_BASE_URL = 'https://dev.gachigacha.kro.kr';
const WEB_APP_SHELL_SOURCE = readFileSync(
  new URL('../src/screens/WebAppShellScreen.tsx', import.meta.url),
  'utf8',
);

function runSessionSyncScript(script, initialEntries) {
  const entries = new Map(Object.entries(initialEntries));
  const operations = [];
  let reloadCount = 0;
  const messages = [];
  const window = {
    location: {
      reload() {
        reloadCount += 1;
      },
    },
    ReactNativeWebView: {
      postMessage(message) {
        messages.push(JSON.parse(message));
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
  return { entries, messages, operations, reloadCount };
}

function runApiCompatibilityScript(requestUrl, method) {
  const requests = [];
  const window = {
    fetch(input, init) {
      requests.push({ input, init });
      return Promise.resolve();
    },
    location: {
      href: `${APP_BASE_URL}/mypage`,
      origin: APP_BASE_URL,
    },
  };

  const script = createWebShellApiCompatibilityScript();
  new Function('window', 'URL', script)(window, URL);
  new Function('window', 'URL', script)(window, URL);
  window.fetch(requestUrl, { method });

  return requests;
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
  for (const path of ['/privacy', '/updates', '/account-deletion']) {
    assert.deepEqual(
      classifyWebShellNavigation(APP_BASE_URL, `${APP_BASE_URL}${path}`),
      { type: 'allow' },
    );
  }
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
  for (const url of [
    'https://brand.naver.com/item/1',
    'https://www.instagram.com/gachi__.gacha/',
    'https://privacy.kisa.or.kr',
    'tel:0212345678',
    'mailto:help@gachigacha.kr',
  ]) {
    assert.deepEqual(classifyWebShellNavigation(APP_BASE_URL, url), {
      type: 'external',
    });
  }
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
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, 'intent://trade/1'),
    { type: 'block' },
  );
  assert.deepEqual(
    classifyWebShellNavigation(APP_BASE_URL, 'file:///data/local/private'),
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

test('새 창의 같은 origin 문서만 현재 WebView 이동 스크립트를 만든다', () => {
  const privacyUrl = `${APP_BASE_URL}/privacy?source=mypage#collection`;
  const script = createWebShellSameOriginNavigationScript(
    APP_BASE_URL,
    privacyUrl,
  );

  assert.match(script, /window\.location\.assign/);
  assert.match(script, /\/privacy\?source=mypage#collection/);
  assert.doesNotThrow(() => new Function('window', script));
  assert.throws(() =>
    createWebShellSameOriginNavigationScript(
      APP_BASE_URL,
      'https://dev.gachigacha.kro.kr.attacker.example/privacy',
    ),
  );
  assert.throws(() =>
    createWebShellSameOriginNavigationScript(
      APP_BASE_URL,
      'https://www.instagram.com/gachi__.gacha/',
    ),
  );
  assert.throws(() =>
    createWebShellSameOriginNavigationScript(
      APP_BASE_URL,
      'javascript:alert(1)',
    ),
  );
});

test('허용된 네이티브 브리지 메시지만 파싱한다', () => {
  assert.deepEqual(
    parseWebShellMessage(
      JSON.stringify({ type: 'gachigacha:auth-session-synced' }),
    ),
    { type: 'auth-session-synced' },
  );
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
  assert.deepEqual(
    parseWebShellMessage(
      JSON.stringify({
        type: 'gachigacha:chat-room-state',
        isOpen: true,
      }),
    ),
    { isOpen: true, type: 'chat-room-state' },
  );
  assert.equal(
    parseWebShellMessage(
      JSON.stringify({
        type: 'gachigacha:chat-room-state',
        isOpen: 'true',
      }),
    ),
    null,
  );
  assert.equal(
    parseWebShellMessage(JSON.stringify({ type: 'run-native-command' })),
    null,
  );
});

test('구형 회원 탈퇴 DELETE 요청만 현재 API 경로로 보정한다', () => {
  const rewritten = runApiCompatibilityScript(
    `${APP_BASE_URL}/api/v1/oauth/withdraw`,
    'DELETE',
  );
  assert.equal(rewritten.length, 1);
  assert.equal(
    rewritten[0].input,
    `${APP_BASE_URL}/api/v1/members/me`,
  );

  const samePathGet = runApiCompatibilityScript(
    `${APP_BASE_URL}/api/v1/oauth/withdraw`,
    'GET',
  );
  assert.equal(
    samePathGet[0].input,
    `${APP_BASE_URL}/api/v1/oauth/withdraw`,
  );

  const externalDelete = runApiCompatibilityScript(
    'https://example.com/api/v1/oauth/withdraw',
    'DELETE',
  );
  assert.equal(
    externalDelete[0].input,
    'https://example.com/api/v1/oauth/withdraw',
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
  assert.match(runtimeScript, /data-gachigacha-android-chat-room/);
  assert.match(runtimeScript, /gachigacha:chat-room-state/);
  assert.match(runtimeScript, /data-gachigacha-android-chat-main/);
  assert.match(runtimeScript, /data-gachigacha-android-chat-drawer/);
  assert.match(runtimeScript, /data-gachigacha-android-chat-composer/);
  assert.match(runtimeScript, /data-gachigacha-android-chat-messages/);
  assert.match(runtimeScript, /--gachigacha-android-chat-height/);
  assert.match(runtimeScript, /window\.visualViewport/);
  assert.match(runtimeScript, /chatViewport\.scrollIntoView/);
  assert.match(runtimeScript, /document\.scrollingElement\?\.scrollTo/);
  assert.doesNotMatch(runtimeScript, /data-gachigacha-android-chat-trade-action/);
  assert.doesNotMatch(runtimeScript, /data-gachigacha-android-chat-product-summary/);
  assert.doesNotMatch(runtimeScript, /예약 확정/);
  assert.match(runtimeScript, /--gachigacha-android-map-header-top/);
  assert.match(runtimeScript, /addEventListener\('scroll'/);
  assert.match(runtimeScript, /data-gachigacha-android-avatar-fallback/);
  assert.match(runtimeScript, /defaultProfileImage/);
  assert.match(runtimeScript, /markProfileAvatar/);
  assert.doesNotMatch(runtimeScript, /normalizeAvatarInitial|CurrentUserInitial/);
  assert.match(runtimeScript, /전체 대화/);
  assert.match(runtimeScript, /trade-comments-title/);
  assert.match(runtimeScript, /프로필 사진 선택/);
  assert.match(runtimeScript, /\/api\/v1\/oauth\/withdraw/);
  assert.match(runtimeScript, /\/api\/v1\/members\/me/);
  assert.match(runtimeScript, /gachigachaAndroidAvatarFallbackImage/);
  assert.match(runtimeScript, /data:image\/svg\+xml/);
  assert.doesNotMatch(runtimeScript, /%3Crect/);
  assert.match(runtimeScript, /bottom: 12px/);
  assert.match(bootstrapScript, /gachigacha:auth-refresh-token/);
  assert.doesNotMatch(bootstrapScript, /<\/script>/);
  assert.match(syncScript, /sessionChanged/);
  assert.match(syncScript, /window\.location\.reload/);
  assert.match(syncScript, /gachigacha:auth-session-synced/);
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

test('Android 뒤로가기는 열린 채팅방을 목록으로 먼저 닫는다', () => {
  const script = createWebShellChatListNavigationScript();

  assert.match(script, /data-gachigacha-android-chat-room/);
  assert.match(script, /button\[aria-label="채팅 닫기"\]/);
  assert.match(script, /closeButton\.click\(\)/);
  assert.match(script, /new URL\('\/chat'/);
  assert.match(WEB_APP_SHELL_SOURCE, /isChatRoomOpenRef\.current/);
  assert.match(
    WEB_APP_SHELL_SOURCE,
    /createWebShellChatListNavigationScript\(\)/,
  );
});

test('사진 닫기 응답은 유효한 요청 번호와 boolean만 받는다', () => {
  const result = { type: 'gachigacha:overlay-back-result', requestId: 1, handled: true };
  assert.deepEqual(parseWebShellMessage(JSON.stringify(result)), {
    type: 'overlay-back-result', requestId: 1, handled: true,
  });
  for (const requestId of [0, -1, 0.5, '1', null, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(parseWebShellMessage(JSON.stringify({ ...result, requestId })), null);
    assert.throws(() => createWebShellOverlayBackScript(requestId));
  }
  assert.equal(parseWebShellMessage(JSON.stringify({ ...result, handled: 'true' })), null);
  assert.doesNotThrow(() => new Function(createWebShellOverlayBackScript(1)));
  assert.match(WEB_APP_SHELL_SOURCE, /createWebShellOverlayBackScript\(requestId, expiresAt\)/);
});

test('사진 닫기와 history 뒤로가기를 중복 실행하지 않는다', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const requests = [];
  let navigations = 0;
  const controller = createWebShellBackController({
    dispatch: id => { requests.push(id); return true; },
    onUnhandled: () => { navigations++; },
  });
  controller.press();
  controller.press();
  assert.deepEqual(requests, [1]);
  controller.resolve(99, false);
  controller.resolve(1, true);
  t.mock.timers.tick(1000);
  assert.equal(navigations, 0);
  controller.press();
  controller.resolve(1, false);
  controller.resolve(2, false);
  controller.resolve(2, false);
  assert.equal(navigations, 1);
  controller.cancel();
});

test('브리지 무응답은 재시도를 안내하고 로딩·오류만 즉시 뒤로가며 취소된 응답은 무시한다', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let navigations = 0;
  let unresponsive = 0;
  const controller = createWebShellBackController({
    dispatch: () => true,
    onUnhandled: () => { navigations++; },
    onUnresponsive: () => { unresponsive++; },
  });
  controller.press();
  t.mock.timers.tick(500);
  assert.equal(navigations, 0);
  assert.equal(unresponsive, 1);
  controller.resolve(1, false);
  assert.equal(navigations, 0);
  controller.press();
  controller.cancel();
  controller.resolve(2, false);
  t.mock.timers.tick(1000);
  assert.equal(navigations, 0);
  for (const dispatch of [() => false, () => { throw new Error('unmounted'); }]) {
    const unavailable = createWebShellBackController({
      dispatch, onUnhandled: () => { navigations++; },
    });
    unavailable.press();
    unavailable.cancel();
  }
  assert.equal(navigations, 2);
});

test('사진을 닫은 뒤 응답만 늦어져도 상세글을 추가로 이탈하지 않는다', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const actions = [];
  let requestId;
  const controller = createWebShellBackController({
    dispatch: id => { requestId = id; return true; },
    onUnhandled: () => actions.push('history'),
  });
  controller.press();
  t.mock.timers.tick(400);
  actions.push('photo-closed');
  t.mock.timers.tick(200);
  controller.resolve(requestId, true);
  assert.deepEqual(actions, ['photo-closed']);
  controller.press();
  controller.resolve(requestId, false);
  assert.deepEqual(actions, ['photo-closed', 'history']);
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
  assert.deepEqual(matching.messages, [
    { type: 'gachigacha:auth-session-synced' },
  ]);

  const stale = runSessionSyncScript(createWebShellSessionSyncScript(tokens), {
    'gachi-gacha:access-token': 'stale-access',
    'gachi-gacha:refresh-token': 'stale-refresh',
  });

  assert.equal(stale.reloadCount, 1);
  assert.deepEqual(stale.messages, []);
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
  assert.deepEqual(guest.messages, []);
});

test('세션 동기화 응답이 누락되어도 앱 화면을 무기한 차단하지 않는다', () => {
  assert.doesNotMatch(WEB_APP_SHELL_SOURCE, /sessionOverlay/);
  assert.doesNotMatch(
    WEB_APP_SHELL_SOURCE,
    /로그인 상태를 확인하고 있어요/,
  );
  assert.match(WEB_APP_SHELL_SOURCE, /WEB_SESSION_READY_FALLBACK_MS/);
  assert.match(WEB_APP_SHELL_SOURCE, /scheduleWebSessionReadyFallback\(\)/);
  assert.match(
    WEB_APP_SHELL_SOURCE,
    /pushNavigationQueueRef\.current\.markReady\(\)/,
  );
});

test('OAuth 완료 스크립트는 로그인 전 같은 origin 화면으로 토큰 주입 후 복귀한다', () => {
  const tokens = {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  };
  const script = createWebShellAuthenticationCompletionScript(
    APP_BASE_URL,
    tokens,
    `${APP_BASE_URL}/trade/37?from=login`,
  );
  const entries = new Map();
  let replacedUrl = null;
  const window = {
    location: {
      replace(url) {
        replacedUrl = url;
      },
    },
    sessionStorage: {
      setItem(key, value) {
        entries.set(key, value);
      },
    },
  };

  new Function('window', script)(window);

  assert.equal(entries.get('gachi-gacha:access-token'), tokens.accessToken);
  assert.equal(entries.get('gachi-gacha:refresh-token'), tokens.refreshToken);
  assert.equal(replacedUrl, `${APP_BASE_URL}/trade/37?from=login`);
});

test('OAuth 완료 복귀 주소가 로그인·외부 주소이면 서비스 홈으로 제한한다', () => {
  const tokens = { accessToken: 'access', refreshToken: 'refresh' };

  for (const returnUrl of [
    `${APP_BASE_URL}/login`,
    `${APP_BASE_URL}/api/v1/oauth/naver`,
    'https://attacker.example/after-login',
    'javascript:alert(1)',
  ]) {
    const script = createWebShellAuthenticationCompletionScript(
      APP_BASE_URL,
      tokens,
      returnUrl,
    );
    let replacedUrl = null;
    const window = {
      location: {
        replace(url) {
          replacedUrl = url;
        },
      },
      sessionStorage: { setItem() {} },
    };

    new Function('window', script)(window);
    assert.equal(replacedUrl, APP_BASE_URL);
  }
});
