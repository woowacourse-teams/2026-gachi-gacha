export const OAUTH_PROVIDERS = ['kakao', 'naver'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return OAUTH_PROVIDERS.some((provider) => provider === value);
}
