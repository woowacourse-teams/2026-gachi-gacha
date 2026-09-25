const AUTH_RETURN_PATH_STORAGE_KEY = 'gachi-gacha:auth-return-path';
const DEFAULT_RETURN_PATH = '/search';

function isAuthFlowPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/auth/callback/');
}

export function normalizeAuthReturnPath(candidate: string | null): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  try {
    const url = new URL(candidate, window.location.origin);

    if (url.origin !== window.location.origin || isAuthFlowPath(url.pathname)) {
      return DEFAULT_RETURN_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_RETURN_PATH;
  }
}

export function readLoginReturnPath(search: string): string {
  const searchParams = new URLSearchParams(search);

  return normalizeAuthReturnPath(searchParams.get('returnTo'));
}

export function storeAuthReturnPath(returnPath: string): void {
  try {
    window.sessionStorage.setItem(
      AUTH_RETURN_PATH_STORAGE_KEY,
      normalizeAuthReturnPath(returnPath),
    );
  } catch {
    // 저장소가 제한된 환경에서는 로그인 후 기본 검색 화면으로 이동합니다.
  }
}

export function peekAuthReturnPath(): string {
  try {
    return normalizeAuthReturnPath(
      window.sessionStorage.getItem(AUTH_RETURN_PATH_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_RETURN_PATH;
  }
}

export function consumeAuthReturnPath(): string {
  const returnPath = peekAuthReturnPath();

  try {
    window.sessionStorage.removeItem(AUTH_RETURN_PATH_STORAGE_KEY);
  } catch {
    // 읽은 복귀 경로는 그대로 사용할 수 있습니다.
  }

  return returnPath;
}

export function createLoginUrl(returnPath: string): string {
  const searchParams = new URLSearchParams({
    returnTo: normalizeAuthReturnPath(returnPath),
  });

  return `/login?${searchParams.toString()}`;
}
