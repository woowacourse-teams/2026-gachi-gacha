import Constants from 'expo-constants';

export function getWebAppBaseUrl(): string {
  const value = String(
    Constants.expoConfig?.extra?.webAppBaseUrl ?? '',
  ).replace(/\/$/, '');

  if (!value) {
    throw new Error('앱의 웹 서비스 주소가 설정되지 않았습니다.');
  }

  return value;
}

export function isWebShellEnabled(): boolean {
  return Constants.expoConfig?.extra?.webShellEnabled === true;
}
