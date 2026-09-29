import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';

export interface UseSearchRouteNavigationResult {
  activeSearch: string;
  selectGacha: (gachaId: number) => void;
}

export function useSearchRouteNavigation(
  controlledSearch: string | undefined,
  onSelectGacha: ((gachaId: number) => void) | undefined,
): UseSearchRouteNavigationResult {
  const { search: browserSearch } = useLocation();
  const navigate = useNavigate();

  const selectGacha = useCallback(
    (gachaId: number) => {
      if (onSelectGacha) {
        onSelectGacha(gachaId);
        return;
      }

      const nextUrl = createGachaSearchResultsUrl(gachaId);
      const nextSearch = new URL(nextUrl, window.location.origin).search;

      if (nextSearch === browserSearch) {
        return;
      }

      navigate(nextUrl);
    },
    [browserSearch, navigate, onSelectGacha],
  );

  return {
    activeSearch: controlledSearch ?? browserSearch,
    selectGacha,
  };
}
