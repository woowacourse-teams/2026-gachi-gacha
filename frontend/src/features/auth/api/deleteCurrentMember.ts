import { isApiResponse } from '@/shared/api/isApiResponse';

import { AuthApiError } from './AuthApiError';
import { authenticatedFetch } from './authenticatedFetch';

const CURRENT_MEMBER_API_PATH = '/api/v1/members/me';
const JSON_CONTENT_TYPE = 'application/json';

export async function deleteCurrentMember(): Promise<void> {
  const response = await authenticatedFetch(CURRENT_MEMBER_API_PATH, {
    method: 'DELETE',
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
      : '회원 탈퇴를 완료하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  if (!isApiResponse(responseBody) || responseBody.code !== 'C003') {
    throw new AuthApiError(
      '회원 탈퇴 응답 형식이 올바르지 않습니다.',
      response.status,
    );
  }
}
