import { isApiResponse } from '@/shared/api/isApiResponse';

import { AuthApiError } from './AuthApiError';

const LOGOUT_API_PATH = '/api/v1/auth/logout';
const JSON_CONTENT_TYPE = 'application/json';

export async function logoutAuthSession(refreshToken: string): Promise<void> {
  const normalizedRefreshToken = refreshToken.trim();

  if (!normalizedRefreshToken) {
    return;
  }

  const response = await fetch(LOGOUT_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
    },
    body: JSON.stringify({ refreshToken: normalizedRefreshToken }),
    keepalive: true,
  });

  if (response.ok) {
    return;
  }

  const contentType = response.headers.get('content-type');
  const responseBody: unknown = contentType?.includes(JSON_CONTENT_TYPE)
    ? await response.json()
    : null;
  const message = isApiResponse(responseBody)
    ? responseBody.message
    : '서버 로그아웃을 완료하지 못했습니다.';

  throw new AuthApiError(message, response.status);
}
