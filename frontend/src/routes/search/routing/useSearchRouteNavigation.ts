import { useCallback, useEffect, useState } from 'react';

import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';

export interface UseSearchRouteNavigationResult {
  activeSearch: string;
  selectGacha: (gachaId: number) => void;
}

export function useSearchRouteNavigation(
  controlledSearch: string | undefined,
  onSelectGacha: ((gachaId: number) => void) | undefined,
): UseSearchRouteNavigationResult {
  const [browserSearch, setBrowserSearch] = useState(
    () => window.location.search,
  );

  useEffect(() => {
    if (controlledSearch !== undefined) {
      return;
    }

    function syncBrowserSearch() {
      setBrowserSearch(window.location.search);
    }

    window.addEventListener('popstate', syncBrowserSearch);

    return () => {
      window.removeEventListener('popstate', syncBrowserSearch);
    };
  }, [controlledSearch]);

  const selectGacha = useCallback(
    (gachaId: number) => {
      if (onSelectGacha) {
        onSelectGacha(gachaId);
        return;
      }

      const nextUrl = createGachaSearchResultsUrl(gachaId);
      const nextSearch = new URL(nextUrl, window.location.origin).search;

      if (nextSearch === window.location.search) {
        return;
      }

      window.history.pushState(null, '', nextUrl);
      setBrowserSearch(nextSearch);
    },
    [onSelectGacha],
  );

  return {
    activeSearch: controlledSearch ?? browserSearch,
    selectGacha,
  };
}
