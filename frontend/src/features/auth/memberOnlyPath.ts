/**
 * 로그인해야 들어갈 수 있는 화면. `App`의 `ProtectedRoutes`와 같은 목록을 유지한다.
 * 로그인 화면에서 닫기를 누를 때 이 화면들로는 돌려보내지 않는다.
 */
const MEMBER_ONLY_PATH_PATTERNS: readonly RegExp[] = [
  /^\/trade\/new\/?$/,
  /^\/trade\/[^/]+\/edit\/?$/,
  /^\/chat(\/.*)?$/,
  /^\/notifications\/?$/,
  /^\/mypage(\/.*)?$/,
  /^\/events\/popular-goods\/?$/,
];

export function isMemberOnlyPath(pathname: string): boolean {
  return MEMBER_ONLY_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

const HOME_PATH = '/trade';

/** 로그인 화면의 닫기 목적지: 돌아갈 화면이 회원 전용이면 홈으로 보낸다. */
export function getLoginCloseTarget(returnPath: string): string {
  const { pathname } = new URL(returnPath, window.location.origin);

  return isMemberOnlyPath(pathname) ? HOME_PATH : returnPath;
}
