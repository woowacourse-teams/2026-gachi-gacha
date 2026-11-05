import { useEffect } from 'react';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { readAccessToken } from '@/features/auth/authTokenStorage';
import { markNotificationRead } from '@/features/notifications/api/notificationApi';

import {
  isInNativeApp,
  NATIVE_PUSH_OPENED_EVENT,
  NATIVE_PUSH_TOKEN_EVENT,
  notifyNativeBridgeReady,
  parseNativePushOpened,
  parseNativePushToken,
  registerNativePushToken,
  requestNativePushToken,
} from './nativePushBridge';

function readEventDetail(event: Event): unknown {
  return event instanceof CustomEvent ? (event.detail as unknown) : null;
}

/**
 * 앱(WebView) 안에서만 동작한다. 일반 브라우저에서는 아무것도 하지 않는다.
 *
 * - 로그인 상태가 되면 앱에 FCM 토큰을 요청하고, 받은 토큰을 서버에 등록한다.
 * - 알림을 눌러 들어오면 앱이 경로를 바꾼 뒤 이벤트를 보내므로, 여기서는 읽음 처리만 한다.
 */
export function NativePushBridge(): null {
  const { status } = useAuthSession();

  useEffect(() => {
    if (!isInNativeApp()) {
      return undefined;
    }

    const handlePushToken = (event: Event) => {
      const pushToken = parseNativePushToken(readEventDetail(event));

      // 토큰 갱신 이벤트는 로그아웃 상태에서도 올 수 있다.
      if (!pushToken || !readAccessToken()) {
        return;
      }

      void registerNativePushToken(pushToken).catch(() => undefined);
    };

    const handlePushOpened = (event: Event) => {
      const opened = parseNativePushOpened(readEventDetail(event));

      if (!opened?.notificationId || !readAccessToken()) {
        return;
      }

      void markNotificationRead(String(opened.notificationId)).catch(
        () => undefined,
      );
    };

    window.addEventListener(NATIVE_PUSH_TOKEN_EVENT, handlePushToken);
    window.addEventListener(NATIVE_PUSH_OPENED_EVENT, handlePushOpened);
    notifyNativeBridgeReady();

    return () => {
      window.removeEventListener(NATIVE_PUSH_TOKEN_EVENT, handlePushToken);
      window.removeEventListener(NATIVE_PUSH_OPENED_EVENT, handlePushOpened);
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && isInNativeApp()) {
      requestNativePushToken();
    }
  }, [status]);

  return null;
}
