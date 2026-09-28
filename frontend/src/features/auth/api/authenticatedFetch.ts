import {
  clearAuthTokens,
  readAccessToken,
  readRefreshToken,
  storeAuthTokens,
} from '../authTokenStorage';
import { AuthApiError } from './AuthApiError';
import { refreshAuthTokensOnce } from './refreshAuthTokens';

type AuthenticationExpiredListener = () => void;

const authenticationExpiredListeners = new Set<AuthenticationExpiredListener>();

function notifyAuthenticationExpired(): void {
  authenticationExpiredListeners.forEach((listener) => {
    listener();
  });
}

function expireAuthentication(): void {
  clearAuthTokens();
  notifyAuthenticationExpired();
}

function createAuthenticatedRequestInit(
  input: RequestInfo | URL,
  init: RequestInit,
  accessToken: string,
): RequestInit {
  const headers = new Headers(
    input instanceof Request ? input.headers : undefined,
  );

  new Headers(init.headers).forEach((value, key) => {
    headers.set(key, value);
  });
  headers.set('Authorization', `Bearer ${accessToken}`);

  return { ...init, headers };
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

  const retryInput = input instanceof Request ? input.clone() : input;
  const response = await fetch(
    input,
    createAuthenticatedRequestInit(input, init, accessToken),
  );

  if (response.status !== 401) {
    return response;
  }

  let retryAccessToken = readAccessToken();

  try {
    if (!retryAccessToken || retryAccessToken === accessToken) {
      const refreshToken = readRefreshToken();

      if (!refreshToken) {
        expireAuthentication();
        return response;
      }

      const refreshedTokens = await refreshAuthTokensOnce(refreshToken);
      const currentRefreshToken = readRefreshToken();

      if (
        currentRefreshToken !== refreshToken &&
        currentRefreshToken !== refreshedTokens.refreshToken
      ) {
        return response;
      }

      storeAuthTokens(refreshedTokens);
      retryAccessToken = refreshedTokens.accessToken;
    }
  } catch {
    expireAuthentication();
    return response;
  }

  const retryResponse = await fetch(
    retryInput,
    createAuthenticatedRequestInit(retryInput, init, retryAccessToken),
  );

  if (retryResponse.status === 401) {
    expireAuthentication();
  }

  return retryResponse;
}
