import { useEffect, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getNearbyStores } from './api/getNearbyStores';
import type { NearbyStoreSearchParams } from './api/nearbyStoreSearchParamsType';
import type { NearbyStoresResponseDto } from './api/nearbyStoresResponseType';

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

function createCategoryIdsKey(categoryIds?: readonly number[]): string {
  return [...new Set(categoryIds)].sort((a, b) => a - b).join(',');
}

async function loadSearchStores(
  params: NearbyStoreSearchParams,
  signal: AbortSignal,
): Promise<AsyncState<NearbyStoresResponseDto>> {
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
  const [state, setState] =
    useState<AsyncState<NearbyStoresResponseDto>>(IDLE_STATE);
  const latitude = params?.latitude;
  const longitude = params?.longitude;
  const radius = params?.radius;
  const keyword = params?.keyword?.trim() || undefined;
  const categoryIdsKey = createCategoryIdsKey(params?.categoryIds);

  useEffect(() => {
    if (
      latitude === undefined ||
      longitude === undefined ||
      radius === undefined
    ) {
      setState(IDLE_STATE);
      return;
    }

    const controller = new AbortController();
    const requestParams: NearbyStoreSearchParams = {
      latitude,
      longitude,
      radius,
      ...(keyword !== undefined && { keyword }),
      ...(categoryIdsKey && {
        categoryIds: categoryIdsKey.split(',').map(Number),
      }),
    };

    async function applySearchResult() {
      const nextState = await loadSearchStores(
        requestParams,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setState(nextState);
      }
    }

    setState(LOADING_STATE);
    void applySearchResult();

    return () => {
      controller.abort();
    };
  }, [categoryIdsKey, keyword, latitude, longitude, radius]);

  return state;
}
