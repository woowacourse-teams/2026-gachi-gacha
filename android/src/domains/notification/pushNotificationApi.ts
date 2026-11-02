import { getApiBaseUrl } from '../../config/api';
import { authenticatedFetch } from '../auth/authApi';

const PUSH_TOKENS_PATH = '/api/v1/push-tokens';

function createJsonRequest(method: 'DELETE' | 'PUT', token: string): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      method === 'PUT' ? { token, platform: 'ANDROID' } : { token },
    ),
  };
}

export async function registerAndroidPushToken(token: string): Promise<void> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error('등록할 푸시 토큰이 올바르지 않습니다.');
  }

  const response = await authenticatedFetch(
    PUSH_TOKENS_PATH,
    createJsonRequest('PUT', normalizedToken),
  );

  if (!response.ok) {
    throw new Error('푸시 알림을 연결하지 못했습니다.');
  }
}

export async function unregisterAndroidPushToken(
  accessToken: string,
  token: string,
): Promise<void> {
  const normalizedAccessToken = accessToken.trim();
  const normalizedPushToken = token.trim();

  if (!normalizedAccessToken || !normalizedPushToken) {
    return;
  }

  const response = await fetch(`${getApiBaseUrl()}${PUSH_TOKENS_PATH}`, {
    ...createJsonRequest('DELETE', normalizedPushToken),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${normalizedAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('푸시 알림 연결을 해제하지 못했습니다.');
  }
}
