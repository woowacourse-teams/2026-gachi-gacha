import { isApiResponse } from '@/shared/api/isApiResponse';

import type { AuthMember } from '../authMemberType';
import { AuthApiError } from './AuthApiError';
import { parseMemberResponse } from './parseMemberResponse';

const CURRENT_MEMBER_API_PATH = '/api/v1/members/me';
const JSON_CONTENT_TYPE = 'application/json';

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(
      '서버가 JSON 형식으로 응답하지 않았습니다.',
      response.status,
    );
  }

  return response.json() as Promise<unknown>;
}

export async function getCurrentMember(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthMember> {
  const response = await fetch(CURRENT_MEMBER_API_PATH, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: signal ?? null,
  });
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const message = isApiResponse(responseBody)
      ? responseBody.message
      : '사용자 정보를 불러오지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  return parseMemberResponse(responseBody);
}
