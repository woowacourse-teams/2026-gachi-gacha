import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthTokens } from '../authTokensType';
import type { OAuthProvider } from '../oauthProviderType';
import { AuthApiError } from './AuthApiError';
import { parseAuthTokensResponse } from './parseAuthTokensResponse';

const JSON_CONTENT_TYPE = 'application/json';
const CALLBACK_PARAMETER_NAMES = [
  'code',
  'state',
  'error',
  'error_description',
] as const;

function createLoginCallbackUrl(
  provider: OAuthProvider,
  callbackSearch: string,
): string {
  const callbackParams = new URLSearchParams(callbackSearch);
  const apiParams = new URLSearchParams();

  CALLBACK_PARAMETER_NAMES.forEach((parameterName) => {
    const value = callbackParams.get(parameterName);

    if (value !== null) {
      apiParams.set(parameterName, value);
    }
  });

  if (!apiParams.has('code') && !apiParams.has('error')) {
    throw new Error('소셜 로그인 인증 결과가 없습니다.');
  }

  return `/api/v1/oauth/login/${provider}?${apiParams.toString()}`;
}

async function exchangeOAuthCode(
  provider: OAuthProvider,
  callbackSearch: string,
): Promise<AuthTokens> {
  const response = await fetch(
    createLoginCallbackUrl(provider, callbackSearch),
    {
      credentials: 'include',
    },
  );
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(
      '서버가 JSON 형식으로 응답하지 않았습니다.',
      response.status,
    );
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const message = isApiResponse(responseBody)
      ? responseBody.message
      : '소셜 로그인을 완료하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  return parseAuthTokensResponse(responseBody);
}

let pendingExchange: { key: string; promise: Promise<AuthTokens> } | undefined;

export function exchangeOAuthCodeOnce(
  provider: OAuthProvider,
  callbackSearch: string,
): Promise<AuthTokens> {
  const key = `${provider}:${callbackSearch}`;

  if (pendingExchange?.key === key) {
    return pendingExchange.promise;
  }

  const promise = exchangeOAuthCode(provider, callbackSearch);
  pendingExchange = { key, promise };

  return promise;
}
