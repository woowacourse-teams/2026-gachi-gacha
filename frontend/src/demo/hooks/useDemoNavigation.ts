import { useCallback, useEffect, useState } from 'react';

export type DemoRoute =
  | { page: 'home' }
  | { page: 'search'; productId: number | null }
  | { page: 'store'; storeId: number | null }
  | { page: 'market' }
  | { page: 'not-found' };

function parseId(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function readDemoRoute(url: URL): DemoRoute {
  const path = url.pathname.replace(/\/$/, '');
  if (path === '/demo') return { page: 'home' };
  if (path === '/demo/search')
    return {
      page: 'search',
      productId: parseId(url.searchParams.get('gachaId')),
    };
  if (path === '/demo/market') return { page: 'market' };
  const storeMatch = /^\/demo\/stores\/([^/]+)$/.exec(path);
  if (storeMatch)
    return { page: 'store', storeId: parseId(storeMatch[1] ?? null) };
  return { page: 'not-found' };
}

export function useDemoNavigation() {
  const [route, setRoute] = useState(() =>
    readDemoRoute(new URL(window.location.href)),
  );

  useEffect(() => {
    const handlePopState = () =>
      setRoute(readDemoRoute(new URL(window.location.href)));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((href: string) => {
    const url = new URL(href, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !/^\/demo(?:\/|$)/.test(url.pathname)
    )
      return;
    window.history.pushState(null, '', url);
    setRoute(readDemoRoute(url));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return { route, navigate };
}
