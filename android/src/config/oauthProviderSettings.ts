import type { MobileOAuthProvider } from '../domains/auth/authTypes';

export type MobileOAuthProviderSetting = {
  authorizationEndpoint: string;
  scope: string;
};

/**
 * 네이버는 일반 OAuth가 아닌 OIDC + PKCE 계약을 사용한다.
 * OIDC 인가 endpoint에는 `.0`이 없고 `openid` scope가 필수다.
 */
export const MOBILE_OAUTH_PROVIDER_SETTINGS: Record<
  MobileOAuthProvider,
  MobileOAuthProviderSetting
> = {
  kakao: {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    scope: 'openid,profile_nickname,profile_image',
  },
  naver: {
    authorizationEndpoint: 'https://nid.naver.com/oauth2/authorize',
    scope: 'openid',
  },
};
