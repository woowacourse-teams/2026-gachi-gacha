export const OAUTH_PROVIDERS = ['apple', 'kakao', 'naver'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const MOBILE_OAUTH_PROVIDERS = ['kakao', 'naver'] as const;

export type MobileOAuthProvider = (typeof MOBILE_OAUTH_PROVIDERS)[number];

export function isMobileOAuthProvider(
  value: unknown,
): value is MobileOAuthProvider {
  return (
    typeof value === 'string' &&
    MOBILE_OAUTH_PROVIDERS.some((provider) => provider === value)
  );
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthMember {
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
  desireTradeLocation: string | null;
}

export interface UpdateAuthMemberInput {
  nickname: string;
  profileImageUrl: string | null;
  desireTradeLocation: string | null;
}

export interface ProfileImageUpload {
  uri: string;
  fileName: string;
  mimeType: string;
}

export type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';
