import Constants from 'expo-constants';

export function arePushNotificationsConfigured(): boolean {
  return Constants.expoConfig?.extra?.pushNotificationsConfigured === true;
}

export function getPushNotificationChannelId(): string {
  const channelId = String(
    Constants.expoConfig?.extra?.pushNotificationChannelId ?? '',
  ).trim();

  if (!channelId) {
    throw new Error('Android 알림 채널이 설정되지 않았습니다.');
  }

  return channelId;
}
