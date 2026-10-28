import { getApiBaseUrl } from '../../config/api';
import { clearAuthTokens, readAuthTokens, storeAuthTokens } from './authTokenStorage';
import type {
  AuthMember,
  AuthTokens,
  ProfileImageUpload,
  UpdateAuthMemberInput,
} from './authTypes';

const JSON_CONTENT_TYPE = 'application/json';

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function readApiMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === 'string'
    ? value.message
    : fallback;
}

async function readJsonResponse(
  response: Response,
  fallbackMessage: string,
): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(fallbackMessage, response.status);
  }

  return response.json() as Promise<unknown>;
}

function parseTokens(value: unknown): AuthTokens {
  if (
    !isRecord(value) ||
    value.code !== 'C000' ||
    !isRecord(value.data) ||
    !isNonBlankString(value.data.accessToken) ||
    !isNonBlankString(value.data.refreshToken)
  ) {
    throw new Error(readApiMessage(value, '인증 토큰 응답 형식이 올바르지 않습니다.'));
  }

  return {
    accessToken: value.data.accessToken.trim(),
    refreshToken: value.data.refreshToken.trim(),
  };
}

function parseMember(value: unknown): AuthMember {
  if (
    !isRecord(value) ||
    (value.code !== 'C000' && value.code !== 'C002') ||
    !isRecord(value.data)
  ) {
    throw new Error(readApiMessage(value, '사용자 정보 응답 형식이 올바르지 않습니다.'));
  }

  const name = value.data.name ?? value.data.oauthUsername ?? null;

  if (
    !isNullableString(name) ||
    !isNullableString(value.data.nickname) ||
    !isNullableString(value.data.profileImageUrl) ||
    !isNullableString(value.data.desireTradeLocation)
  ) {
    throw new Error('사용자 정보 응답 형식이 올바르지 않습니다.');
  }

  return {
    name,
    nickname: value.data.nickname,
    profileImageUrl: value.data.profileImageUrl,
    desireTradeLocation: value.data.desireTradeLocation,
  };
}

function parseUploadedProfileImageUrl(value: unknown): string {
  if (
    !isRecord(value) ||
    value.code !== 'C000' ||
    !isRecord(value.data) ||
    !Array.isArray(value.data.files) ||
    value.data.files.length !== 1 ||
    !isRecord(value.data.files[0]) ||
    !isNonBlankString(value.data.files[0].url)
  ) {
    throw new Error('프로필 사진 업로드 응답 형식이 올바르지 않습니다.');
  }

  return value.data.files[0].url.trim();
}

export function isUnauthorizedAuthError(error: unknown): boolean {
  return error instanceof AuthApiError && error.status === 401;
}

export async function getCurrentMember(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthMember> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/members/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });
  const body = await readJsonResponse(response, '사용자 정보를 불러오지 못했습니다.');

  if (!response.ok) {
    throw new AuthApiError(
      readApiMessage(body, '사용자 정보를 불러오지 못했습니다.'),
      response.status,
    );
  }

  return parseMember(body);
}

export async function updateCurrentMember(
  input: UpdateAuthMemberInput,
): Promise<AuthMember> {
  const response = await authenticatedFetch('/api/v1/members/me', {
    method: 'PATCH',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify(input),
  });
  const body = await readJsonResponse(response, '회원 정보를 수정하지 못했습니다.');

  if (!response.ok) {
    throw new AuthApiError(
      readApiMessage(body, '회원 정보를 수정하지 못했습니다.'),
      response.status,
    );
  }

  return parseMember(body);
}

export async function uploadProfileImage(
  image: ProfileImageUpload,
): Promise<string> {
  const formData = new FormData();
  formData.append(
    'files',
    {
      uri: image.uri,
      name: image.fileName,
      type: image.mimeType,
    } as unknown as Blob,
  );
  const response = await authenticatedFetch('/api/v1/files', {
    method: 'POST',
    body: formData,
  });
  const body = await readJsonResponse(response, '프로필 사진을 업로드하지 못했습니다.');

  if (!response.ok) {
    throw new AuthApiError(
      readApiMessage(body, '프로필 사진을 업로드하지 못했습니다.'),
      response.status,
    );
  }

  return parseUploadedProfileImageUrl(body);
}

const pendingRefreshes = new Map<string, Promise<AuthTokens>>();

export function refreshAuthTokensOnce(refreshToken: string): Promise<AuthTokens> {
  const normalizedRefreshToken = refreshToken.trim();

  if (!normalizedRefreshToken) {
    return Promise.reject(new AuthApiError('갱신할 로그인 정보가 없습니다.', 401));
  }

  const pendingRefresh = pendingRefreshes.get(normalizedRefreshToken);

  if (pendingRefresh) {
    return pendingRefresh;
  }

  const promise = (async () => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': JSON_CONTENT_TYPE },
      body: JSON.stringify({ refreshToken: normalizedRefreshToken }),
    });
    const body = await readJsonResponse(response, '로그인 정보를 갱신하지 못했습니다.');

    if (!response.ok) {
      throw new AuthApiError(
        readApiMessage(body, '로그인 정보를 갱신하지 못했습니다.'),
        response.status,
      );
    }

    return parseTokens(body);
  })().finally(() => {
    pendingRefreshes.delete(normalizedRefreshToken);
  });

  pendingRefreshes.set(normalizedRefreshToken, promise);
  return promise;
}

export async function logoutAuthSession(refreshToken: string): Promise<void> {
  const normalizedRefreshToken = refreshToken.trim();

  if (!normalizedRefreshToken) {
    return;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify({ refreshToken: normalizedRefreshToken }),
  });

  if (response.ok) {
    return;
  }

  const body = response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)
    ? ((await response.json()) as unknown)
    : null;

  throw new AuthApiError(
    readApiMessage(body, '서버 로그아웃을 완료하지 못했습니다.'),
    response.status,
  );
}

let authenticationExpiredListener: (() => void) | null = null;

export function subscribeToAuthenticationExpired(listener: () => void): () => void {
  authenticationExpiredListener = listener;

  return () => {
    if (authenticationExpiredListener === listener) {
      authenticationExpiredListener = null;
    }
  };
}

function withAccessToken(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  return { ...init, headers };
}

async function expireSessionIfCurrent(expectedSession: AuthTokens): Promise<void> {
  const currentSession = await readAuthTokens();

  if (
    currentSession?.accessToken !== expectedSession.accessToken ||
    currentSession.refreshToken !== expectedSession.refreshToken
  ) {
    return;
  }

  await clearAuthTokens();
  authenticationExpiredListener?.();
}

export async function authenticatedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!path.startsWith('/')) {
    throw new Error('인증 API 경로는 /로 시작해야 합니다.');
  }

  const session = await readAuthTokens();

  if (!session) {
    throw new AuthApiError('로그인이 필요한 기능입니다.', 401);
  }

  const url = `${getApiBaseUrl()}${path}`;
  const response = await fetch(url, withAccessToken(init, session.accessToken));

  if (response.status !== 401) {
    return response;
  }

  const latestSession = await readAuthTokens();

  if (!latestSession) {
    throw new AuthApiError('로그인이 필요한 기능입니다.', 401);
  }

  if (latestSession.accessToken !== session.accessToken) {
    const retryResponse = await fetch(
      url,
      withAccessToken(init, latestSession.accessToken),
    );

    if (retryResponse.status === 401) {
      await expireSessionIfCurrent(latestSession);
    }

    return retryResponse;
  }

  try {
    const refreshedTokens = await refreshAuthTokensOnce(latestSession.refreshToken);

    const sessionBeforeStore = await readAuthTokens();
    const refreshWasAlreadyStored =
      sessionBeforeStore?.accessToken === refreshedTokens.accessToken &&
      sessionBeforeStore.refreshToken === refreshedTokens.refreshToken;

    if (!sessionBeforeStore) {
      throw new AuthApiError('로그인 상태가 변경되었습니다.', 401);
    }

    if (!refreshWasAlreadyStored) {
      if (sessionBeforeStore.refreshToken !== latestSession.refreshToken) {
        throw new AuthApiError('로그인 상태가 변경되었습니다.', 401);
      }

      await storeAuthTokens(refreshedTokens);
    }

    const retryResponse = await fetch(
      url,
      withAccessToken(init, refreshedTokens.accessToken),
    );

    if (retryResponse.status === 401) {
      await expireSessionIfCurrent(refreshedTokens);
    }

    return retryResponse;
  } catch (error) {
    if (isUnauthorizedAuthError(error)) {
      await expireSessionIfCurrent(latestSession);
    }

    throw error;
  }
}
