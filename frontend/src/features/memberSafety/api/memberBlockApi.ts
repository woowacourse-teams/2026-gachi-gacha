import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

const JSON_CONTENT_TYPE = 'application/json';

export interface BlockedMember {
  memberId: number;
  nickname: string;
  blockedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBlockedMember(value: unknown): value is BlockedMember {
  return (
    isRecord(value) &&
    typeof value.memberId === 'number' &&
    Number.isSafeInteger(value.memberId) &&
    value.memberId > 0 &&
    typeof value.nickname === 'string' &&
    typeof value.blockedAt === 'string'
  );
}

function validateMemberId(memberId: number): void {
  if (!Number.isSafeInteger(memberId) || memberId <= 0) {
    throw new Error('올바른 회원 ID가 필요합니다.');
  }
}

async function readApiResponse(
  response: Response,
  expectedCode: string,
  fallbackMessage: string,
): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error(fallbackMessage);
  }

  const responseBody: unknown = await response.json();

  if (
    !response.ok ||
    !isApiResponse(responseBody) ||
    responseBody.code !== expectedCode
  ) {
    throw new Error(
      isApiResponse(responseBody) ? responseBody.message : fallbackMessage,
    );
  }

  return responseBody.data;
}

export async function getBlockedMembers(
  signal?: AbortSignal,
): Promise<BlockedMember[]> {
  const response = await authenticatedFetch('/api/v1/blocks', {
    ...(signal ? { signal } : {}),
  });
  const data = await readApiResponse(
    response,
    'C000',
    '차단한 사용자 목록을 불러오지 못했습니다.',
  );

  if (
    !isRecord(data) ||
    !Array.isArray(data.blocks) ||
    !data.blocks.every(isBlockedMember)
  ) {
    throw new Error('차단한 사용자 목록 응답 형식이 올바르지 않습니다.');
  }

  return data.blocks;
}

export async function requestMemberBlock(memberId: number): Promise<void> {
  validateMemberId(memberId);
  const response = await authenticatedFetch(`/api/v1/blocks/${memberId}`, {
    method: 'PUT',
  });

  await readApiResponse(response, 'C002', '사용자를 차단하지 못했습니다.');
}

export async function requestMemberUnblock(memberId: number): Promise<void> {
  validateMemberId(memberId);
  const response = await authenticatedFetch(`/api/v1/blocks/${memberId}`, {
    method: 'DELETE',
  });

  await readApiResponse(response, 'C003', '차단을 해제하지 못했습니다.');
}
