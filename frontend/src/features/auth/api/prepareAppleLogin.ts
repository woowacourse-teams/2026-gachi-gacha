import { isApiResponse } from '@/shared/api/isApiResponse';

import { AuthApiError } from './AuthApiError';

const APPLE_LOGIN_PREPARATION_API_PATH = '/api/v1/oauth/apple/prepare';
const JSON_CONTENT_TYPE = 'application/json';

export interface AppleLoginPreparation {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseAppleLoginPreparation(value: unknown): AppleLoginPreparation {
  if (!isApiResponse(value) || value.code !== 'C000') {
    throw new Error('Apple 로그인 준비 응답 형식이 올바르지 않습니다.');
  }

  if (typeof value.data !== 'object' || value.data === null) {
    throw new Error('Apple 로그인 준비 정보가 없습니다.');
  }

  const data = value.data as Record<string, unknown>;

  if (
    !isNonBlankString(data.clientId) ||
    !isNonBlankString(data.redirectUri) ||
    !isNonBlankString(data.state) ||
    !isNonBlankString(data.nonce)
  ) {
    throw new Error('Apple 로그인 준비 정보가 올바르지 않습니다.');
  }

  const redirectUrl = new URL(data.redirectUri);

  if (redirectUrl.protocol !== 'https:') {
    throw new Error('Apple 로그인 콜백 주소가 올바르지 않습니다.');
  }

  return {
    clientId: data.clientId.trim(),
    redirectUri: redirectUrl.toString(),
    state: data.state.trim(),
    nonce: data.nonce.trim(),
  };
}

export async function prepareAppleLogin(): Promise<AppleLoginPreparation> {
  const response = await fetch(APPLE_LOGIN_PREPARATION_API_PATH, {
    method: 'POST',
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(
      'Apple 로그인을 준비하지 못했습니다.',
      response.status,
    );
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const message = isApiResponse(responseBody)
      ? responseBody.message
      : 'Apple 로그인을 준비하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  return parseAppleLoginPreparation(responseBody);
}
