import { lazy, Suspense, useEffect } from 'react';

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

const SEARCH_PATH = '/search';
const USED_MARKET_PATH = '/used-market';
const STORE_DETAIL_PATH_PATTERN = /^\/stores\/[1-9]\d*$/;

type AppRoute = 'search' | 'storeDetail' | 'usedMarket';

function removeTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function resolveAppRoute(pathname: string): AppRoute {
  const normalizedPathname = removeTrailingSlash(pathname);

  if (normalizedPathname === USED_MARKET_PATH) {
    return 'usedMarket';
  }

  if (STORE_DETAIL_PATH_PATTERN.test(normalizedPathname)) {
    return 'storeDetail';
  }

  return 'search';
}

function createCanonicalSearchUrl(): string {
  return `${SEARCH_PATH}${window.location.search}${window.location.hash}`;
}

export default function App() {
  const route = resolveAppRoute(window.location.pathname);
  const shouldRedirectToSearch =
    route === 'search' && window.location.pathname !== SEARCH_PATH;

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
    route === 'storeDetail' ? (
      <StoreDetailRoute />
    ) : route === 'usedMarket' ? (
      <UsedMarketRoute />
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
