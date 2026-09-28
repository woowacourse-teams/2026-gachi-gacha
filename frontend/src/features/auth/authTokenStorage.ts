import type { AuthTokens } from './authTokensType';

const ACCESS_TOKEN_STORAGE_KEY = 'gachi-gacha:access-token';
const REFRESH_TOKEN_STORAGE_KEY = 'gachi-gacha:refresh-token';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

function readStoredToken(
  key: string,
  memoryToken: string | null,
): string | null {
  try {
    return window.sessionStorage.getItem(key) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

function storeToken(key: string, token: string): void {
  try {
    window.sessionStorage.setItem(key, token);
  } catch {
    // 저장소 접근이 제한된 환경에서는 현재 페이지의 메모리에만 유지합니다.
  }
}

function removeStoredToken(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // 저장소 접근이 제한되어도 메모리 토큰은 별도로 제거합니다.
  }
}

function normalizeToken(token: string, errorMessage: string): string {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error(errorMessage);
  }

  return normalizedToken;
}

export function readAccessToken(): string | null {
  return readStoredToken(ACCESS_TOKEN_STORAGE_KEY, memoryAccessToken);
}

export function readRefreshToken(): string | null {
  return readStoredToken(REFRESH_TOKEN_STORAGE_KEY, memoryRefreshToken);
}

export function storeAccessToken(accessToken: string): void {
  const normalizedToken = normalizeToken(
    accessToken,
    '저장할 로그인 토큰이 없습니다.',
  );

  memoryAccessToken = normalizedToken;
  memoryRefreshToken = null;
  storeToken(ACCESS_TOKEN_STORAGE_KEY, normalizedToken);
  removeStoredToken(REFRESH_TOKEN_STORAGE_KEY);
}

export function storeAuthTokens(tokens: AuthTokens): void {
  const accessToken = normalizeToken(
    tokens.accessToken,
    '저장할 access token이 없습니다.',
  );
  const refreshToken = normalizeToken(
    tokens.refreshToken,
    '저장할 refresh token이 없습니다.',
  );

  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;
  storeToken(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  storeToken(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearAuthTokens(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  removeStoredToken(ACCESS_TOKEN_STORAGE_KEY);
  removeStoredToken(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearAccessToken(): void {
  clearAuthTokens();
}
