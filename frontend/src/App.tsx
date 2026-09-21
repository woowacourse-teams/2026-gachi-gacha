import { lazy, Suspense } from 'react';

import { GlobalStyles } from '@/shared/ui/GlobalStyles';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

const SearchRoute = lazy(async () => {
  const routeModule = await import('@/routes/search/route');

  return { default: routeModule.SearchRoute };
});

export default function App() {
  const route =
    window.location.pathname === '/search' ? (
      <Suspense
        fallback={<PageLoadingFallback label="검색 결과를 준비하고 있어요." />}
      >
        <SearchRoute />
      </Suspense>
    ) : null;

  return (
    <>
      <GlobalStyles />
      {route}
    </>
  );
}
