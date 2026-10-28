export const OAUTH_PROVIDERS = ['apple', 'kakao', 'naver'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

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
