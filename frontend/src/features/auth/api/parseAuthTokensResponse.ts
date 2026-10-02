import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthTokens } from '../authTokensType';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonBlankString(value.accessToken) && isNonBlankString(value.refreshToken)
  );
}

export function parseAuthTokensResponse(value: unknown): AuthTokens {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isAuthTokens(value.data)) {
    throw new Error('인증 토큰 응답 형식이 올바르지 않습니다.');
  }

  return {
    accessToken: value.data.accessToken.trim(),
    refreshToken: value.data.refreshToken.trim(),
  };
}
