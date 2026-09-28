import { isApiResponse } from '@/shared/api/isApiResponse';

import type { OAuthProvider } from '../oauthProviderType';
import { AuthApiError } from './AuthApiError';

const JSON_CONTENT_TYPE = 'application/json';
const CALLBACK_PARAMETER_NAMES = [
  'code',
  'state',
  'error',
  'error_description',
] as const;

interface OAuthLoginResponse {
  token: string;
}

function isOAuthLoginResponse(value: unknown): value is OAuthLoginResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  return typeof response.token === 'string' && response.token.trim().length > 0;
}

function parseOAuthLoginResponse(value: unknown): string {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isOAuthLoginResponse(value.data)) {
    throw new Error('소셜 로그인 응답 형식이 올바르지 않습니다.');
  }

  return value.data.token;
}

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
): Promise<string> {
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

  return parseOAuthLoginResponse(responseBody);
}

let pendingExchange: { key: string; promise: Promise<string> } | undefined;

export function exchangeOAuthCodeOnce(
  provider: OAuthProvider,
  callbackSearch: string,
): Promise<string> {
  const key = `${provider}:${callbackSearch}`;

  if (pendingExchange?.key === key) {
    return pendingExchange.promise;
  }

  const promise = exchangeOAuthCode(provider, callbackSearch);
  pendingExchange = { key, promise };

  return promise;
}
