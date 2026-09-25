import type { AuthMember } from '@/features/auth/authMemberType';
import { isApiResponse } from '@/shared/api/isApiResponse';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isAuthMember(value: unknown): value is AuthMember {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableString(value.nickname) &&
    isNullableString(value.profileImageUrl) &&
    isNullableString(value.desireTradeLocation)
  );
}

export function parseMemberResponse(value: unknown): AuthMember {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isAuthMember(value.data)) {
    throw new Error('사용자 정보 응답 형식이 올바르지 않습니다.');
  }

  return value.data;
}
