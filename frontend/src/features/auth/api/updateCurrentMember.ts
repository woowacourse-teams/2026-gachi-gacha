import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthMember } from '../authMemberType';
import { AuthApiError } from './AuthApiError';
import { authenticatedFetch } from './authenticatedFetch';
import { parseMemberResponse } from './parseMemberResponse';

const CURRENT_MEMBER_API_PATH = '/api/v1/members/me';
const JSON_CONTENT_TYPE = 'application/json';

export interface UpdateCurrentMemberInput {
  nickname: string;
  profileImageUrl: string | null;
  desireTradeLocation: string | null;
}

export async function updateCurrentMember(
  input: UpdateCurrentMemberInput,
): Promise<AuthMember> {
  const response = await authenticatedFetch(CURRENT_MEMBER_API_PATH, {
    method: 'PATCH',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
    },
    body: JSON.stringify(input),
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
      : '회원 정보를 수정하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  return parseMemberResponse(responseBody, ['C002']);
}
