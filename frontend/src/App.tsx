import { lazy, Suspense, useEffect } from 'react';

import {
  isOAuthProvider,
  type OAuthProvider,
} from '@/features/auth/oauthProviderType';
import { GlobalStyles } from '@/shared/ui/GlobalStyles';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

const SearchRoute = lazy(async () => {
  const routeModule = await import('@/routes/search/route');

  return { default: routeModule.SearchRoute };
});

const StoreDetailRoute = lazy(async () => {
  const routeModule = await import('@/routes/stores.$storeId/route');

  return { default: routeModule.StoreDetailRoute };
});

const UsedMarketRoute = lazy(async () => {
  const routeModule = await import('@/routes/used-market/route');

  return { default: routeModule.UsedMarketRoute };
});

const LoginRoute = lazy(async () => {
  const routeModule = await import('@/routes/login/route');

  return { default: routeModule.LoginRoute };
});

const AuthCallbackRoute = lazy(async () => {
  const routeModule = await import('@/routes/auth-callback/route');

  return { default: routeModule.AuthCallbackRoute };
});

const SEARCH_PATH = '/search';
const USED_MARKET_PATH = '/used-market';
const LOGIN_PATH = '/login';
const STORE_DETAIL_PATH_PATTERN = /^\/stores\/[1-9]\d*$/;
const AUTH_CALLBACK_PATH_PATTERN = /^\/auth\/callback\/([^/]+)$/;

type AppRoute =
  | { page: 'search' }
  | { page: 'storeDetail' }
  | { page: 'usedMarket' }
  | { page: 'login' }
  | { page: 'authCallback'; provider: OAuthProvider };

function removeTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function resolveAppRoute(pathname: string): AppRoute {
  const normalizedPathname = removeTrailingSlash(pathname);

  if (normalizedPathname === USED_MARKET_PATH) {
    return { page: 'usedMarket' };
  }

  if (normalizedPathname === LOGIN_PATH) {
    return { page: 'login' };
  }

  if (STORE_DETAIL_PATH_PATTERN.test(normalizedPathname)) {
    return { page: 'storeDetail' };
  }

  const callbackMatch = AUTH_CALLBACK_PATH_PATTERN.exec(normalizedPathname);
  const provider = callbackMatch?.[1];

  if (provider && isOAuthProvider(provider)) {
    return { page: 'authCallback', provider };
  }

  return { page: 'search' };
}

function createCanonicalSearchUrl(): string {
  return `${SEARCH_PATH}${window.location.search}${window.location.hash}`;
}

export default function App() {
  const route = resolveAppRoute(window.location.pathname);
  const shouldRedirectToSearch =
    route.page === 'search' && window.location.pathname !== SEARCH_PATH;

  useEffect(() => {
    if (!shouldRedirectToSearch) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      '',
      createCanonicalSearchUrl(),
    );
  }, [shouldRedirectToSearch]);

  const routeElement =
    route.page === 'storeDetail' ? (
      <StoreDetailRoute />
    ) : route.page === 'usedMarket' ? (
      <UsedMarketRoute />
    ) : route.page === 'login' ? (
      <LoginRoute />
    ) : route.page === 'authCallback' ? (
      <AuthCallbackRoute provider={route.provider} />
    ) : (
      <SearchRoute />
    );

  return (
    <>
      <GlobalStyles />
      <Suspense
        fallback={<PageLoadingFallback label="페이지를 준비하고 있어요." />}
      >
        {routeElement}
      </Suspense>
    </>
  );
}
