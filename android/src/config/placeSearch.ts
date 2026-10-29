import Constants from 'expo-constants';

type OAuthExtra = {
  clientIds?: {
    kakao?: unknown;
  };
};

export function getKakaoPlaceSearchRestApiKey(): string {
  const oauthExtra: unknown = Constants.expoConfig?.extra?.oauth;
  const extra =
    typeof oauthExtra === 'object' && oauthExtra !== null
      ? (oauthExtra as OAuthExtra)
      : {};
  const apiKey =
    typeof extra.clientIds?.kakao === 'string'
      ? extra.clientIds.kakao.trim()
      : '';

  if (!apiKey) {
    throw new Error('카카오 장소 검색 설정을 확인해 주세요.');
  }

  return apiKey;
}
