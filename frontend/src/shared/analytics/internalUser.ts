const INTERNAL_USER_STORAGE_KEY = 'gachi-gacha:analytics-internal-user';
const INTERNAL_USER_QUERY_PARAM = 'analytics_internal';

let cachedInternalUser: boolean | undefined;

function readStoredInternalUser(): boolean {
  try {
    return window.localStorage.getItem(INTERNAL_USER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function storeInternalUser(isInternalUser: boolean): void {
  try {
    if (isInternalUser) {
      window.localStorage.setItem(INTERNAL_USER_STORAGE_KEY, 'true');
      return;
    }

    window.localStorage.removeItem(INTERNAL_USER_STORAGE_KEY);
  } catch {
    // 저장소 접근이 제한되면 현재 페이지에서만 판별한 값을 사용합니다.
  }
}

function removeInternalUserQueryParam(url: URL): void {
  url.searchParams.delete(INTERNAL_USER_QUERY_PARAM);
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function getIsInternalUser(): boolean {
  if (cachedInternalUser !== undefined) {
    return cachedInternalUser;
  }

  const url = new URL(window.location.href);
  const queryValue = url.searchParams.get(INTERNAL_USER_QUERY_PARAM);
  let isInternalUser = readStoredInternalUser();

  if (queryValue === 'true') {
    isInternalUser = true;
    storeInternalUser(true);
    removeInternalUserQueryParam(url);
  } else if (queryValue === 'false') {
    isInternalUser = false;
    storeInternalUser(false);
    removeInternalUserQueryParam(url);
  }

  cachedInternalUser = isInternalUser;

  return isInternalUser;
}
