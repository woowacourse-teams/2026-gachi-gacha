import { lazy, Suspense } from 'react';

const SearchRoute = lazy(async () => {
  const routeModule = await import('@/routes/search/route');

  return { default: routeModule.SearchRoute };
});

export default function App() {
  if (window.location.pathname === '/search') {
    return (
      <Suspense fallback={<p role="status">검색 결과를 준비하고 있어요.</p>}>
        <SearchRoute />
      </Suspense>
    );
  }

  return null;
}
