import Constants from 'expo-constants';

export function isKakaoMapConfigured(): boolean {
  return Constants.expoConfig?.extra?.kakaoMapNativeAppKeyConfigured === true;
}
