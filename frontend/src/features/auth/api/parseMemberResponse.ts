import type { AuthMember } from '@/features/auth/authMemberType';
import { isApiResponse } from '@/shared/api/isApiResponse';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

interface MemberResponseData {
  name?: unknown;
  oauthUsername?: unknown;
  nickname: string | null;
  profileImageUrl: string | null;
  desireTradeLocation: string | null;
}

function isMemberResponseData(value: unknown): value is MemberResponseData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableString(value.nickname) &&
    isNullableString(value.profileImageUrl) &&
    isNullableString(value.desireTradeLocation)
  );
}

function parseMemberName(value: MemberResponseData): string | null {
  const name = value.name ?? value.oauthUsername ?? null;

  if (!isNullableString(name)) {
    throw new Error('사용자 이름 응답 형식이 올바르지 않습니다.');
  }

  return name;
}

export function parseMemberResponse(
  value: unknown,
  successCodes: readonly string[] = ['C000'],
): AuthMember {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (!successCodes.includes(value.code)) {
    throw new Error(value.message);
  }

  if (!isMemberResponseData(value.data)) {
    throw new Error('사용자 정보 응답 형식이 올바르지 않습니다.');
  }

  return {
    name: parseMemberName(value.data),
    nickname: value.data.nickname,
    profileImageUrl: value.data.profileImageUrl,
    desireTradeLocation: value.data.desireTradeLocation,
  };
}
