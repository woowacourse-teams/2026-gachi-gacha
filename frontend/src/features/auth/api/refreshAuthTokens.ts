import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthTokens } from '../authTokensType';
import { AuthApiError } from './AuthApiError';
import { parseAuthTokensResponse } from './parseAuthTokensResponse';

const REFRESH_API_PATH = '/api/v1/auth/refresh';
const JSON_CONTENT_TYPE = 'application/json';

async function refreshAuthTokens(refreshToken: string): Promise<AuthTokens> {
  const normalizedRefreshToken = refreshToken.trim();

  if (!normalizedRefreshToken) {
    throw new AuthApiError('갱신할 로그인 정보가 없습니다.', 401);
  }

  const response = await fetch(REFRESH_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
    },
    body: JSON.stringify({ refreshToken: normalizedRefreshToken }),
  });
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
      : '로그인 정보를 갱신하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  return parseAuthTokensResponse(responseBody);
}

const pendingRefreshes = new Map<string, Promise<AuthTokens>>();

export function refreshAuthTokensOnce(
  refreshToken: string,
): Promise<AuthTokens> {
  const normalizedRefreshToken = refreshToken.trim();
  const pendingRefresh = pendingRefreshes.get(normalizedRefreshToken);

  if (pendingRefresh) {
    return pendingRefresh;
  }

  const promise = refreshAuthTokens(normalizedRefreshToken).finally(() => {
    if (pendingRefreshes.get(normalizedRefreshToken) === promise) {
      pendingRefreshes.delete(normalizedRefreshToken);
    }
  });

  pendingRefreshes.set(normalizedRefreshToken, promise);

  return promise;
}
