import { useEffect, useRef, useState } from 'react';

import { getNearbyStores } from './nearbyStoreApi';
import type { MapCoordinate, NearbyStore } from './storeTypes';

export const HONGDAE_SEARCH_CENTER = {
  latitude: 37.5563,
  longitude: 126.9236,
} as const;

export const STORE_SEARCH_RADIUS_METERS = 3000;

type StoreSearchState = {
  status: 'loading' | 'success' | 'error';
  stores: NearbyStore[];
  errorMessage: string | null;
};

export function useNearbyStores(gachaId: number | null, center: MapCoordinate) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StoreSearchState>({
    status: 'loading',
    stores: [],
    errorMessage: null,
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    setState({ status: 'loading', stores: [], errorMessage: null });

    getNearbyStores({
      latitude: center.latitude,
      longitude: center.longitude,
      radius: STORE_SEARCH_RADIUS_METERS,
      gachaId,
      signal: controller.signal,
    })
      .then((result) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setState({ status: 'success', stores: result.stores, errorMessage: null });
      })
      .catch((error: unknown) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setState({
          status: 'error',
          stores: [],
          errorMessage: error instanceof Error ? error.message : '주변 매장을 불러오지 못했습니다.',
        });
      });

    return () => {
      controller.abort();
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [attempt, center.latitude, center.longitude, gachaId]);

  return {
    ...state,
    retry: () => setAttempt((value) => value + 1),
  };
}
