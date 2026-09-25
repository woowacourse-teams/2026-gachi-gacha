const ACCESS_TOKEN_STORAGE_KEY = 'gachi-gacha:access-token';

let memoryAccessToken: string | null = null;

export function readAccessToken(): string | null {
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return memoryAccessToken;
  }
}

export function storeAccessToken(accessToken: string): void {
  const normalizedToken = accessToken.trim();

  if (!normalizedToken) {
    throw new Error('저장할 로그인 토큰이 없습니다.');
  }

  memoryAccessToken = normalizedToken;

  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, normalizedToken);
  } catch {
    // 저장소 접근이 제한된 환경에서는 현재 페이지의 메모리에만 유지합니다.
  }
}

export function clearAccessToken(): void {
  memoryAccessToken = null;

  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // 저장소 접근이 제한되어도 메모리 토큰은 위에서 제거됩니다.
  }
}
