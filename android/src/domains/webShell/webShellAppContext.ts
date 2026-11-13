const REQUEST_TYPE = 'gachigacha:app-context-request';
const RESPONSE_EVENT = 'gachigacha:app-context';
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,96}$/;
export const APP_CONTEXT_TIMEOUT_MS = 2_000;

export interface WebShellAppContext {
  schemaVersion: 1;
  platform: 'ANDROID';
  appVersion: string;
  versionCode: number;
  environment: 'development' | 'production';
  verification: 'client-signal';
}

interface AppConfig {
  version?: string;
  android?: { versionCode?: number };
  extra?: { appVariant?: unknown };
}

/** Metadata only: never treat this client signal as installation attestation. */
export function createWebShellAppContext(
  config: AppConfig | null | undefined,
): WebShellAppContext | null {
  const appVersion = config?.version;
  const versionCode = config?.android?.versionCode;
  const environment = config?.extra?.appVariant;
  if (
    typeof appVersion !== 'string' || !appVersion.trim() || appVersion.length > 100 ||
    typeof versionCode !== 'number' || !Number.isSafeInteger(versionCode) || versionCode < 1 ||
    (environment !== 'development' && environment !== 'production')
  ) return null;

  return {
    schemaVersion: 1,
    platform: 'ANDROID',
    appVersion,
    versionCode,
    environment,
    verification: 'client-signal',
  };
}

/** Caller must check the WebView message's source origin before parsing. */
export function parseWebShellAppContextRequest(
  data: string,
): { requestId: string } | null {
  if (data.length > 512) return null;
  try {
    const message: unknown = JSON.parse(data);
    if (
      typeof message !== 'object' || message === null ||
      !('type' in message) || message.type !== REQUEST_TYPE ||
      !('schemaVersion' in message) || message.schemaVersion !== 1 ||
      !('requestId' in message) || typeof message.requestId !== 'string' ||
      !REQUEST_ID_PATTERN.test(message.requestId)
    ) return null;
    return { requestId: message.requestId };
  } catch {
    return null;
  }
}

function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function trustedOrigin(appBaseUrl: string): string {
  const url = new URL(appBaseUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
    url.pathname !== '/' || url.search || url.hash) {
    throw new Error('앱 환경 브리지는 경로가 없는 HTTPS origin만 허용합니다.');
  }
  return url.origin;
}

/** Install before load and again at runtime: Android early injection can race. */
export function createWebShellAppContextBridgeScript(appBaseUrl: string): string {
  return `
    (() => {
      const origin = ${serialize(trustedOrigin(appBaseUrl))};
      const trusted = () => window === window.top && window.location.origin === origin;
      if (!trusted() || window.GachiGachaNative) return;
      const pending = new Map();
      let counter = 0;
      // Correlates replies to this document, not a device ID or security nonce.
      const documentId = Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
      const finish = (requestId, value) => {
        const entry = pending.get(requestId);
        if (!entry) return;
        pending.delete(requestId);
        window.clearTimeout(entry.timer);
        entry.resolve(value);
      };
      const parseContext = value => {
        if (!value || typeof value !== 'object' ||
          value.schemaVersion !== 1 || value.platform !== 'ANDROID' ||
          typeof value.appVersion !== 'string' || !value.appVersion.trim() || value.appVersion.length > 100 ||
          !Number.isSafeInteger(value.versionCode) || value.versionCode < 1 ||
          !['development', 'production'].includes(value.environment) ||
          value.verification !== 'client-signal') return null;
        return Object.freeze({
          schemaVersion: 1, platform: 'ANDROID', appVersion: value.appVersion,
          versionCode: value.versionCode, environment: value.environment,
          verification: 'client-signal',
        });
      };
      window.addEventListener(${serialize(RESPONSE_EVENT)}, event => {
        if (!trusted()) return;
        const detail = event.detail;
        if (!detail || detail.schemaVersion !== 1 || typeof detail.requestId !== 'string') return;
        finish(detail.requestId, parseContext(detail.context));
      });
      window.addEventListener('pagehide', () => {
        for (const requestId of Array.from(pending.keys())) finish(requestId, null);
      });
      window.GachiGachaNative = Object.freeze({
        schemaVersion: 1,
        getAppContext() {
          const bridge = window.ReactNativeWebView;
          if (!trusted() || !bridge || typeof bridge.postMessage !== 'function' || pending.size >= 16) {
            return Promise.resolve(null);
          }
          return new Promise(resolve => {
            const requestId = documentId + '_' + (++counter).toString(36);
            const timer = window.setTimeout(() => finish(requestId, null), ${APP_CONTEXT_TIMEOUT_MS});
            pending.set(requestId, { resolve, timer });
            try {
              bridge.postMessage(JSON.stringify({
                type: ${serialize(REQUEST_TYPE)}, schemaVersion: 1, requestId,
              }));
            } catch { finish(requestId, null); }
          });
        },
      });
    })();
    true;
  `;
}

/** Recheck the receiving document: it may have navigated after sending a request. */
export function createWebShellAppContextResponseScript(
  appBaseUrl: string,
  requestId: string,
  context: WebShellAppContext | null,
): string {
  if (!REQUEST_ID_PATTERN.test(requestId)) throw new Error('잘못된 앱 환경 요청 ID입니다.');
  return `
    (() => {
      if (window !== window.top || window.location.origin !== ${serialize(trustedOrigin(appBaseUrl))}) return;
      window.dispatchEvent(new CustomEvent(${serialize(RESPONSE_EVENT)}, {
        detail: ${serialize({ schemaVersion: 1, requestId, context })},
      }));
    })();
    true;
  `;
}
