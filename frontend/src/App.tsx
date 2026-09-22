import { lazy, Suspense, useEffect } from 'react';

import { GlobalStyles } from '@/shared/ui/GlobalStyles';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

const SearchRoute = lazy(async () => {
  const routeModule = await import('@/routes/search/route');

  return { default: routeModule.SearchRoute };
});

const SEARCH_PATH = '/search';

function createCanonicalSearchUrl(): string {
  return `${SEARCH_PATH}${window.location.search}${window.location.hash}`;
}

export default function App() {
  useEffect(() => {
    if (window.location.pathname === SEARCH_PATH) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      '',
      createCanonicalSearchUrl(),
    );
  }, []);

  return (
    <>
      <GlobalStyles />
      <Suspense
        fallback={<PageLoadingFallback label="검색 결과를 준비하고 있어요." />}
      >
        <SearchRoute />
      </Suspense>
    </>
  );
}
