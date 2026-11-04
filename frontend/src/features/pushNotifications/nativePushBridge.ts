import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';

/**
 * iOS·Android 앱(WebView)과 주고받는 푸시 브리지.
 *
 * 앱은 웹의 로그인 토큰을 읽지 않는다. 앱은 FCM 등록 토큰만 넘기고,
 * 로그인 상태를 아는 웹이 /push-tokens 를 직접 호출한다.
 * 프로토콜은 ios/src/push/webBridge.ts 와 맞춘다.
 */
const PUSH_TOKENS_API_PATH = '/api/v1/push-tokens';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const NATIVE_PUSH_TOKEN_EVENT = 'gachigacha:push-token';
export const NATIVE_PUSH_OPENED_EVENT = 'gachigacha:push-opened';
const BRIDGE_READY_MESSAGE = 'gachigacha:native-bridge-ready';
const PUSH_TOKEN_REQUEST_MESSAGE = 'gachigacha:push-token-request';

const PUSH_PLATFORMS = ['IOS', 'ANDROID'] as const;

export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

export interface NativePushToken {
  token: string;
  platform: PushPlatform;
}

export interface NativePushOpened {
  notificationId: number | null;
}

interface ReactNativeWebViewBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebViewBridge;
  }
}

/** 이 기기에서 마지막으로 등록한 토큰. 로그아웃할 때 지울 대상이다. */
let registeredPushToken: string | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNativeBridge(): ReactNativeWebViewBridge | null {
  const bridge = window.ReactNativeWebView;

  return bridge && typeof bridge.postMessage === 'function' ? bridge : null;
}

function postToNative(type: string): void {
  getNativeBridge()?.postMessage(JSON.stringify({ type }));
}

export function isInNativeApp(): boolean {
  return getNativeBridge() !== null;
}

export function notifyNativeBridgeReady(): void {
  postToNative(BRIDGE_READY_MESSAGE);
}

/** 앱은 이 요청을 받았을 때 처음으로 알림 권한을 묻는다. */
export function requestNativePushToken(): void {
  postToNative(PUSH_TOKEN_REQUEST_MESSAGE);
}

export function parseNativePushToken(detail: unknown): NativePushToken | null {
  if (!isRecord(detail)) {
    return null;
  }

  const { token, platform } = detail;

  if (
    typeof token !== 'string' ||
    !token.trim() ||
    !PUSH_PLATFORMS.includes(platform as PushPlatform)
  ) {
    return null;
  }

  return { token: token.trim(), platform: platform as PushPlatform };
}

export function parseNativePushOpened(
  detail: unknown,
): NativePushOpened | null {
  if (!isRecord(detail)) {
    return null;
  }

  const { notificationId } = detail;

  return {
    notificationId:
      Number.isSafeInteger(notificationId) && Number(notificationId) > 0
        ? Number(notificationId)
        : null,
  };
}

export async function registerNativePushToken({
  token,
  platform,
}: NativePushToken): Promise<void> {
  const response = await authenticatedFetch(PUSH_TOKENS_API_PATH, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify({ token, platform }),
  });

  if (!response.ok) {
    throw new Error('푸시 토큰을 등록하지 못했습니다.');
  }

  registeredPushToken = token;
}

/**
 * 로그아웃할 때 access token을 지우기 전에 호출한다.
 * authenticatedFetch는 첫 await 전에 토큰을 읽으므로, 호출 직후 토큰을 지워도 요청에는 실린다.
 */
export function unregisterNativePushToken(): Promise<void> {
  const token = registeredPushToken;
  registeredPushToken = null;

  if (!token) {
    return Promise.resolve();
  }

  return authenticatedFetch(PUSH_TOKENS_API_PATH, {
    method: 'DELETE',
    headers: JSON_HEADERS,
    body: JSON.stringify({ token }),
  }).then(() => undefined);
}

export function resetRegisteredPushTokenForTest(): void {
  registeredPushToken = null;
}
