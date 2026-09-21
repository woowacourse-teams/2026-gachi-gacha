import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getNearbyStores } from './api/getNearbyStores';
import type { NearbyStoreSearchParams } from './api/nearbyStoreSearchParamsType';
import type { NearbyStoresResponseDto } from './api/nearbyStoresResponseType';

type SettledSearchStoresState = Extract<
  AsyncState<NearbyStoresResponseDto>,
  { status: 'success' | 'error' }
>;

interface SearchStoresRequest extends NearbyStoreSearchParams {
  attempt: number;
}

interface SettledSearchResult {
  request: SearchStoresRequest;
  state: SettledSearchStoresState;
}

export interface UseSearchStoresResult {
  storesState: AsyncState<NearbyStoresResponseDto>;
  retryStores: () => void;
}

const DEFAULT_ERROR_MESSAGE = '주변 매장을 불러오지 못했습니다.';
const IDLE_STATE: AsyncState<NearbyStoresResponseDto> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: AsyncState<NearbyStoresResponseDto> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

async function loadSearchStores(
  params: NearbyStoreSearchParams,
  signal: AbortSignal,
): Promise<SettledSearchStoresState> {
  try {
    const data = await getNearbyStores(params, signal);

    return { status: 'success', data, errorMessage: null };
  } catch (error: unknown) {
    return {
      status: 'error',
      data: null,
      errorMessage: getErrorMessage(error),
    };
  }
}

export function useSearchStores(
  params: NearbyStoreSearchParams | null,
): UseSearchStoresResult {
  const [attempt, setAttempt] = useState(0);
  const [settledResult, setSettledResult] =
    useState<SettledSearchResult | null>(null);
  const gachaId = params?.gachaId;
  const latitude = params?.latitude;
  const longitude = params?.longitude;
  const radius = params?.radius;
  const requestParams = useMemo<SearchStoresRequest | null>(() => {
    if (
      gachaId === undefined ||
      latitude === undefined ||
      longitude === undefined ||
      radius === undefined
    ) {
      return null;
    }

    return {
      gachaId,
      latitude,
      longitude,
      radius,
      attempt,
    };
  }, [attempt, gachaId, latitude, longitude, radius]);
  const retryStores = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    if (!requestParams) {
      return;
    }

    const activeRequestParams = requestParams;
    const controller = new AbortController();

    async function applySearchResult() {
      const nextState = await loadSearchStores(
        activeRequestParams,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setSettledResult({ request: activeRequestParams, state: nextState });
      }
    }

    void applySearchResult();

    return () => {
      controller.abort();
    };
  }, [requestParams]);

  if (!requestParams) {
    return { storesState: IDLE_STATE, retryStores };
  }

  if (settledResult?.request !== requestParams) {
    return { storesState: LOADING_STATE, retryStores };
  }

  return { storesState: settledResult.state, retryStores };
}
