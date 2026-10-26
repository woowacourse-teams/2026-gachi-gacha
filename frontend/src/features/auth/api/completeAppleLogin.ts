import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthTokens } from '../authTokensType';
import { AuthApiError } from './AuthApiError';
import { parseAuthTokensResponse } from './parseAuthTokensResponse';

const APPLE_LOGIN_API_PATH = '/api/v1/oauth/login/apple';
const JSON_CONTENT_TYPE = 'application/json';

export interface CompleteAppleLoginInput {
  code: string;
  state: string;
  user?: AppleSignInUser;
}

export async function completeAppleLogin({
  code,
  state,
  user,
}: CompleteAppleLoginInput): Promise<AuthTokens> {
  const formData = new URLSearchParams({ code, state });

  if (user) {
    formData.set('user', JSON.stringify(user));
  }

  const response = await fetch(APPLE_LOGIN_API_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: formData,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(
      'Apple 로그인을 완료하지 못했습니다.',
      response.status,
    );
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const message = isApiResponse(responseBody)
      ? responseBody.message
      : 'Apple 로그인을 완료하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  return parseAuthTokensResponse(responseBody);
}
