import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import {
  arePushNotificationsConfigured,
  getPushNotificationChannelId,
} from '../../config/pushNotifications';
import { useAuthSession } from '../auth/AuthSessionContext';
import { markNotificationRead } from './notificationApi';
import { registerAndroidPushToken } from './pushNotificationApi';
import { resolvePushNotificationDestination } from './pushNotificationRouting';
import { storePushToken } from './pushTokenStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function readAndroidToken(token: Notifications.DevicePushToken): string | null {
  return token.type === 'android' && typeof token.data === 'string'
    ? token.data.trim() || null
    : null;
}

async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  return (await Notifications.requestPermissionsAsync()).granted;
}

async function ensureAndroidNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(
    getPushNotificationChannelId(),
    {
      name: '댓글과 채팅',
      description: '내 교환글의 새 댓글과 새 채팅 메시지를 알려드려요.',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#d93b54',
      sound: 'default',
      vibrationPattern: [0, 180, 120, 180],
    },
  );
}

export function usePushNotifications(
  onOpenPath: (path: string) => void,
): void {
  const { status } = useAuthSession();
  const onOpenPathRef = useRef(onOpenPath);
  const handledResponseIdsRef = useRef(new Set<string>());

  useEffect(() => {
    onOpenPathRef.current = onOpenPath;
  }, [onOpenPath]);

  useEffect(() => {
    if (
      Platform.OS !== 'android' ||
      !arePushNotificationsConfigured() ||
      status !== 'authenticated'
    ) {
      return;
    }

    let active = true;
    let syncInFlight = false;

    const registerToken = async (token: Notifications.DevicePushToken) => {
      const value = readAndroidToken(token);
      if (!value || !active) return;

      await storePushToken(value);
      await registerAndroidPushToken(value);
    };

    const synchronize = async () => {
      if (syncInFlight) return;
      syncInFlight = true;

      try {
        await ensureAndroidNotificationChannel();
        if (!(await ensureNotificationPermission()) || !active) return;
        await registerToken(await Notifications.getDevicePushTokenAsync());
      } catch {
        // 네트워크·권한·Firebase 초기화 실패는 다음 앱 활성화 때 재시도한다.
      } finally {
        syncInFlight = false;
      }
    };

    const tokenSubscription = Notifications.addPushTokenListener((token) => {
      void registerToken(token).catch(() => undefined);
    });
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active') void synchronize();
      },
    );

    void synchronize();

    return () => {
      active = false;
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [status]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !arePushNotificationsConfigured()) {
      return;
    }

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseIdsRef.current.has(responseId)) return;

      const destination = resolvePushNotificationDestination(
        response.notification.request.content.data,
      );
      if (!destination) return;

      handledResponseIdsRef.current.add(responseId);
      Notifications.clearLastNotificationResponse();
      onOpenPathRef.current(destination.path);

      if (destination.notificationId && status === 'authenticated') {
        void markNotificationRead(destination.notificationId).catch(
          () => undefined,
        );
      }
    };

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse) handleResponse(initialResponse);

    return () => responseSubscription.remove();
  }, [status]);
}
