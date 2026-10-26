import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthTokens } from '../authTokensType';
import type { OAuthProvider } from '../oauthProviderType';
import { AuthApiError } from './AuthApiError';
import { parseAuthTokensResponse } from './parseAuthTokensResponse';

const JSON_CONTENT_TYPE = 'application/json';
const APPLE_LOGIN_COMPLETION_API_PATH =
  '/api/v1/oauth/login/apple/complete';
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

async function parseAuthTokens(response: Response): Promise<AuthTokens> {
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
  return parseAuthTokens(response);
}

async function exchangeAppleLoginTicket(
  callbackSearch: string,
): Promise<AuthTokens> {
  const ticket = new URLSearchParams(callbackSearch).get('ticket')?.trim();

  if (!ticket) {
    throw new Error('Apple 로그인 인증 결과가 없습니다.');
  }

  const response = await fetch(APPLE_LOGIN_COMPLETION_API_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify({ ticket }),
  });

  return parseAuthTokens(response);
}

async function exchangeOAuthCallback(
  provider: OAuthProvider,
  callbackSearch: string,
): Promise<AuthTokens> {
  const hasTicket = new URLSearchParams(callbackSearch).has('ticket');

  if (hasTicket) {
    if (provider !== 'apple') {
      throw new Error('소셜 로그인 인증 결과가 올바르지 않습니다.');
    }

    return exchangeAppleLoginTicket(callbackSearch);
  }

  return exchangeOAuthCode(provider, callbackSearch);
}

let pendingExchange: { key: string; promise: Promise<AuthTokens> } | undefined;

export function exchangeOAuthCallbackOnce(
  provider: OAuthProvider,
  callbackSearch: string,
): Promise<AuthTokens> {
  const key = `${provider}:${callbackSearch}`;

  if (pendingExchange?.key === key) {
    return pendingExchange.promise;
  }

  const promise = exchangeOAuthCallback(provider, callbackSearch);
  pendingExchange = { key, promise };

  return promise;
}
