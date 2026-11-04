import type { AuthTokens } from '../auth/authTypes';

const ACCESS_TOKEN_KEY = 'gachi-gacha:access-token';
const REFRESH_TOKEN_KEY = 'gachi-gacha:refresh-token';
const SNAPSHOT_MESSAGE = 'gachigacha:auth-session-snapshot';

function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** 호출자는 먼저 WebView 메시지 origin을 검사해야 한다. */
export function parseWebShellSessionSnapshot(
  data: string,
): { tokens: AuthTokens | null } | null {
  try {
    const message: unknown = JSON.parse(data);
    if (!message || typeof message !== 'object' ||
      !('type' in message) || message.type !== SNAPSHOT_MESSAGE ||
      !('tokens' in message)) return null;
    if (message.tokens === null) return { tokens: null };
    const tokens = message.tokens;
    if (!tokens || typeof tokens !== 'object' ||
      !('accessToken' in tokens) || typeof tokens.accessToken !== 'string' ||
      !('refreshToken' in tokens) || typeof tokens.refreshToken !== 'string') return null;
    const accessToken = tokens.accessToken.trim();
    const refreshToken = tokens.refreshToken.trim();
    return accessToken && refreshToken
      ? { tokens: { accessToken, refreshToken } }
      : null;
  } catch {
    return null;
  }
}

export function createWebShellSessionSnapshotRequestScript(): string {
  return `
    (() => {
      try {
        const accessToken = window.sessionStorage.getItem(${serialize(ACCESS_TOKEN_KEY)});
        const refreshToken = window.sessionStorage.getItem(${serialize(REFRESH_TOKEN_KEY)});
        // 웹은 access/refresh를 연이어 기록한다. 중간 상태를 로그아웃으로 오인하지 않는다.
        if (Boolean(accessToken) !== Boolean(refreshToken)) return;
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: ${serialize(SNAPSHOT_MESSAGE)},
          tokens: accessToken && refreshToken ? { accessToken, refreshToken } : null,
        }));
      } catch {}
    })();
    true;
  `;
}

/** 웹에서 회전한 access/refresh 한 쌍을 같은 작업이 끝난 뒤 함께 보관한다. */
export function createWebShellSessionSnapshotBridgeScript(): string {
  return `
    (() => {
      if (window.__gachigachaAndroidSessionSnapshotInstalled) return;
      window.__gachigachaAndroidSessionSnapshotInstalled = true;
      const accessKey = ${serialize(ACCESS_TOKEN_KEY)};
      const refreshKey = ${serialize(REFRESH_TOKEN_KEY)};
      let scheduled = false;
      const schedule = () => {
        if (window.__gachigachaAndroidNativeSessionWrite || scheduled) return;
        scheduled = true;
        Promise.resolve().then(() => {
          scheduled = false;
          ${createWebShellSessionSnapshotRequestScript()}
        });
      };
      const setItem = Storage.prototype.setItem;
      const removeItem = Storage.prototype.removeItem;
      const clear = Storage.prototype.clear;
      Storage.prototype.setItem = function(key, value) {
        setItem.call(this, key, value);
        if (this === window.sessionStorage && (key === accessKey || key === refreshKey)) schedule();
      };
      Storage.prototype.removeItem = function(key) {
        removeItem.call(this, key);
        if (this === window.sessionStorage && (key === accessKey || key === refreshKey)) schedule();
      };
      Storage.prototype.clear = function() {
        clear.call(this);
        if (this === window.sessionStorage) schedule();
      };
    })();
  `;
}

/**
 * 같은 회원의 토큰 회전은 저장소만 동기화한다. 갤러리 복귀/FCM 등록 갱신 때문에
 * 문서를 다시 로드하면 웹이 소유한 열린 dialog, File, 작성 중 입력값이 사라진다.
 * 로그인/로그아웃 및 계정 교체는 웹 인증 Context를 다시 만드는 기존 경계를 유지한다.
 */
export function createWebShellSessionSyncScript(tokens: AuthTokens | null): string {
  return `
    (() => {
      try {
        const accessKey = ${serialize(ACCESS_TOKEN_KEY)};
        const refreshKey = ${serialize(REFRESH_TOKEN_KEY)};
        const currentAccess = window.sessionStorage.getItem(accessKey);
        const currentRefresh = window.sessionStorage.getItem(refreshKey);
        const next = ${serialize(tokens)};
        const sessionChanged = currentAccess !== (next?.accessToken ?? null) ||
          currentRefresh !== (next?.refreshToken ?? null);
        // memberId는 UI 상태 유지 판단에만 사용한다. 실제 인증/권한 검증은 서버의 몫이다.
        const memberId = token => {
          try {
            const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
            return payload.type === 'access' && Number.isSafeInteger(payload.memberId) && payload.memberId > 0
              ? payload.memberId : null;
          } catch { return null; }
        };
        const previousMember = currentAccess ? memberId(currentAccess) : null;
        const sameMember = Boolean(currentAccess && currentRefresh && next && (
          currentAccess === next.accessToken ||
          (previousMember !== null && previousMember === memberId(next.accessToken))
        ));
        if (sessionChanged) {
          window.__gachigachaAndroidNativeSessionWrite = true;
          try {
            if (next) {
              window.sessionStorage.setItem(accessKey, next.accessToken);
              window.sessionStorage.setItem(refreshKey, next.refreshToken);
            } else {
              window.sessionStorage.removeItem(accessKey);
              window.sessionStorage.removeItem(refreshKey);
            }
          } finally {
            window.__gachigachaAndroidNativeSessionWrite = false;
          }
          if (!sameMember) {
            window.location.reload();
            return;
          }
        }
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'gachigacha:auth-session-synced' }));
      } catch {}
    })();
    true;
  `;
}
