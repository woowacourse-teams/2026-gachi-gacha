import { useEffect, useMemo, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { createNearbyStoreSearchUrl } from './api/createNearbyStoreSearchUrl';
import { getNearbyStores } from './api/getNearbyStores';
import type { NearbyStoreSearchParams } from './api/nearbyStoreSearchParamsType';
import type { NearbyStoresResponseDto } from './api/nearbyStoresResponseType';

type SearchStoresState = AsyncState<NearbyStoresResponseDto>;
type SettledSearchStoresState = Extract<
  SearchStoresState,
  { status: 'success' | 'error' }
>;

interface SettledSearchResult {
  requestKey: string;
  state: SettledSearchStoresState;
}

const DEFAULT_ERROR_MESSAGE = '주변 매장을 불러오지 못했습니다.';
const IDLE_STATE: SearchStoresState = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: SearchStoresState = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

function createCategoryIdsKey(categoryIds?: readonly number[]): string {
  return [...new Set(categoryIds)].sort((a, b) => a - b).join(',');
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

export function useSearchStores(params: NearbyStoreSearchParams | null) {
  const [settledResult, setSettledResult] =
    useState<SettledSearchResult | null>(null);
  const latitude = params?.latitude;
  const longitude = params?.longitude;
  const radius = params?.radius;
  const keyword = params?.keyword?.trim() || undefined;
  const categoryIdsKey = createCategoryIdsKey(params?.categoryIds);
  const requestParams = useMemo<NearbyStoreSearchParams | null>(() => {
    if (
      latitude === undefined ||
      longitude === undefined ||
      radius === undefined
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
      radius,
      ...(keyword !== undefined && { keyword }),
      ...(categoryIdsKey && {
        categoryIds: categoryIdsKey.split(',').map(Number),
      }),
    };
  }, [categoryIdsKey, keyword, latitude, longitude, radius]);
  const requestKey = requestParams
    ? createNearbyStoreSearchUrl(requestParams)
    : null;

  useEffect(() => {
    if (!requestParams || !requestKey) {
      return;
    }

    const activeRequestParams = requestParams;
    const activeRequestKey = requestKey;
    const controller = new AbortController();

    async function applySearchResult() {
      const nextState = await loadSearchStores(
        activeRequestParams,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setSettledResult({ requestKey: activeRequestKey, state: nextState });
      }
    }

    void applySearchResult();

    return () => {
      controller.abort();
    };
  }, [requestKey, requestParams]);

  if (!requestKey) {
    return IDLE_STATE;
  }

  if (settledResult?.requestKey !== requestKey) {
    return LOADING_STATE;
  }

  return settledResult.state;
}
