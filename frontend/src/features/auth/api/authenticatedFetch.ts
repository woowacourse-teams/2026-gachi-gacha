import { clearAccessToken, readAccessToken } from '../authTokenStorage';
import { AuthApiError } from './AuthApiError';

type AuthenticationExpiredListener = () => void;

const authenticationExpiredListeners = new Set<AuthenticationExpiredListener>();

function notifyAuthenticationExpired(): void {
  authenticationExpiredListeners.forEach((listener) => {
    listener();
  });
}

export function subscribeToAuthenticationExpired(
  listener: AuthenticationExpiredListener,
): () => void {
  authenticationExpiredListeners.add(listener);

  return () => {
    authenticationExpiredListeners.delete(listener);
  };
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = readAccessToken();

  if (!accessToken) {
    throw new AuthApiError('로그인이 필요한 기능입니다.', 401);
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    clearAccessToken();
    notifyAuthenticationExpired();
  }

  return response;
}
