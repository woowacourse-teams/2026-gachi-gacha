import {
  clearAuthTokens,
  readAccessToken,
  readRefreshToken,
  storeAuthTokens,
} from '../authTokenStorage';
import { AuthApiError, isUnauthorizedAuthApiError } from './AuthApiError';
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
  } catch (error) {
    if (isUnauthorizedAuthApiError(error)) {
      expireAuthentication();
      return response;
    }

    throw error;
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

/**
 * 공개 API지만 로그인 사용자의 문맥이 필요할 때 사용합니다.
 * 저장된 토큰이 있으면 갱신까지 포함한 인증 요청을 보내고, 없으면 공개 요청을 보냅니다.
 */
export async function optionallyAuthenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return readAccessToken()
    ? authenticatedFetch(input, init)
    : fetch(input, init);
}
