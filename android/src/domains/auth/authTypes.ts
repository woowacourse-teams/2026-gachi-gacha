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

export type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';
