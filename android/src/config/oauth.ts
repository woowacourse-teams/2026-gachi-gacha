import Constants from 'expo-constants';

import type { MobileOAuthProvider } from '../domains/auth/authTypes';

type OAuthExtra = {
  callbackBaseUrl?: unknown;
  clientIds?: {
    kakao?: unknown;
    naver?: unknown;
  };
};

export type MobileOAuthProviderConfig = {
  authorizationEndpoint: string;
  callbackUrl: string;
  clientId: string;
  provider: MobileOAuthProvider;
  scope: string;
};

const PROVIDER_SETTINGS: Record<
  MobileOAuthProvider,
  Pick<MobileOAuthProviderConfig, 'authorizationEndpoint' | 'scope'>
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

function readNonBlankString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readOAuthExtra(): OAuthExtra {
  const value: unknown = Constants.expoConfig?.extra?.oauth;
  return typeof value === 'object' && value !== null ? (value as OAuthExtra) : {};
}

export function getMobileOAuthProviderConfig(
  provider: MobileOAuthProvider,
): MobileOAuthProviderConfig | null {
  const extra = readOAuthExtra();
  const callbackBaseUrl = readNonBlankString(extra.callbackBaseUrl).replace(/\/$/, '');
  const clientId = readNonBlankString(extra.clientIds?.[provider]);

  if (!callbackBaseUrl || !clientId) {
    return null;
  }

  return {
    ...PROVIDER_SETTINGS[provider],
    callbackUrl: `${callbackBaseUrl}/${provider}`,
    clientId,
    provider,
  };
}
