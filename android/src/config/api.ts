import Constants from 'expo-constants';

export function getApiBaseUrl(): string {
  const apiBaseUrl = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/$/, '');

  if (!apiBaseUrl) {
    throw new Error('앱의 서버 주소가 설정되지 않았습니다.');
  }

  return apiBaseUrl;
}
