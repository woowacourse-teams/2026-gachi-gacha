import type { MobileOAuthProvider } from '../domains/auth/authTypes';

export const LOGIN_PROVIDER_ICON_SIZE = 64;

export const LOGIN_PROVIDER_ITEMS = [
  {
    accessibilityLabel: '카카오로 로그인',
    name: '카카오',
    provider: 'kakao',
  },
  {
    accessibilityLabel: '네이버로 로그인',
    name: '네이버',
    provider: 'naver',
  },
] as const satisfies readonly {
  accessibilityLabel: string;
  name: string;
  provider: MobileOAuthProvider;
}[];
