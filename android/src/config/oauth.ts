import Constants from 'expo-constants';

import type { MobileOAuthProvider } from '../domains/auth/authTypes';
import { MOBILE_OAUTH_PROVIDER_SETTINGS } from './oauthProviderSettings';

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
    ...MOBILE_OAUTH_PROVIDER_SETTINGS[provider],
    callbackUrl: `${callbackBaseUrl}/${provider}`,
    clientId,
    provider,
  };
}
