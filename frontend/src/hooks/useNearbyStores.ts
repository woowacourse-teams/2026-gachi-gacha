import { useEffect, useState } from 'react';

import {
  DEFAULT_RADIUS,
  getNearbyStores,
  type NearbyStore,
} from '@/apis/store';

export type NearbyStoresState =
  | { status: 'loading' }
  | { status: 'success'; stores: NearbyStore[] }
  | { status: 'error'; error: Error };

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
}: UseNearbyStoresParams): NearbyStoresState {
  const [state, setState] = useState<NearbyStoresState>(LOADING_STATE);

  useEffect(() => {
    const controller = new AbortController();

    setState(LOADING_STATE);

    getNearbyStores({ latitude, longitude, radius }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setState({ status: 'success', stores: data.stores });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setState({
          status: 'error',
          error:
            cause instanceof Error
              ? cause
              : new Error('주변 매장을 불러오지 못했습니다.'),
        });
      });

    return () => controller.abort();
  }, [latitude, longitude, radius]);

  return state;
}
