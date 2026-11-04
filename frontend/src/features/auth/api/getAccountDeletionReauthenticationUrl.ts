import { isApiResponse } from '@/shared/api/isApiResponse';

import { AuthApiError } from './AuthApiError';
import { authenticatedFetch } from './authenticatedFetch';

const ACCOUNT_DELETION_REAUTHENTICATION_API_PATH = '/api/v1/oauth/withdraw-url';
const JSON_CONTENT_TYPE = 'application/json';
const APPLE_AUTHORIZATION_HOST = 'appleid.apple.com';

export async function getAccountDeletionReauthenticationUrl(): Promise<string> {
  const response = await authenticatedFetch(
    ACCOUNT_DELETION_REAUTHENTICATION_API_PATH,
  );
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(
      '회원 탈퇴 본인 확인 주소를 불러오지 못했습니다.',
      response.status,
    );
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const message = isApiResponse(responseBody)
      ? responseBody.message
      : '회원 탈퇴 본인 확인 주소를 불러오지 못했습니다.';

    throw new AuthApiError(
      message,
      response.status,
      isApiResponse(responseBody) ? responseBody.code : undefined,
    );
  }

  if (
    !isApiResponse(responseBody) ||
    responseBody.code !== 'C000' ||
    typeof responseBody.data !== 'string'
  ) {
    throw new AuthApiError(
      '회원 탈퇴 본인 확인 응답 형식이 올바르지 않습니다.',
      response.status,
    );
  }

  let authorizationUrl: URL;

  try {
    authorizationUrl = new URL(responseBody.data);
  } catch {
    throw new AuthApiError(
      '회원 탈퇴 본인 확인 주소가 올바르지 않습니다.',
      response.status,
    );
  }

  if (
    authorizationUrl.protocol !== 'https:' ||
    authorizationUrl.hostname !== APPLE_AUTHORIZATION_HOST
  ) {
    throw new AuthApiError(
      '회원 탈퇴 본인 확인 주소가 올바르지 않습니다.',
      response.status,
    );
  }

  return authorizationUrl.toString();
}
