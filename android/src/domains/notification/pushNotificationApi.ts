import { getApiBaseUrl } from '../../config/api';
import { authenticatedFetch } from '../auth/authApi';
import {
  clearStoredPushToken,
  readStoredPushToken,
} from './pushTokenStorage';

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

export async function unregisterStoredPushTokenBeforeLogout(
  accessToken: string,
): Promise<void> {
  const pushToken = await readStoredPushToken();
  if (!pushToken) return;

  try {
    await fetch(`${getApiBaseUrl()}${PUSH_TOKENS_PATH}`, {
      ...createJsonRequest('DELETE', pushToken),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } finally {
    await clearStoredPushToken();
  }
}
