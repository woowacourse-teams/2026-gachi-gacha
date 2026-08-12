import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_RADIUS,
  getNearbyStores,
  toNearbyStoresFailure,
  type NearbyStore,
  type NearbyStoresFailure,
} from '@/apis/store';
import type { AsyncState } from '@/types/asyncState';

export type NearbyStoresState = AsyncState<NearbyStore[], NearbyStoresFailure>;

interface UseNearbyStoresParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

const LOADING_STATE: NearbyStoresState = { status: 'loading' };

export function useNearbyStores({
  latitude,
  longitude,
  radius = DEFAULT_RADIUS,
}: UseNearbyStoresParams) {
  const [state, setState] = useState<NearbyStoresState>(LOADING_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState(LOADING_STATE);

    getNearbyStores({ latitude, longitude, radius }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setState({ status: 'success', data: data.stores });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setState({ status: 'error', error: toNearbyStoresFailure(cause) });
      });

    return () => controller.abort();
  }, [latitude, longitude, radius, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { retry, ...state };
}
