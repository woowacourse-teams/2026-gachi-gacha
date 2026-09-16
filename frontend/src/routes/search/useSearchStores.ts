import { useEffect, useState } from 'react';

import { getNearbyStores } from './api/getNearbyStores';
import type { NearbyStoreSearchParams } from './api/nearbyStoreSearchParamsType';
import type { NearbyStoresResponseDto } from './api/nearbyStoresResponseType';

const DEFAULT_ERROR_MESSAGE = '주변 매장을 불러오지 못했습니다.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

export function useSearchStores({
  latitude,
  longitude,
  radius,
  keyword,
  categoryIds,
}: NearbyStoreSearchParams) {
  const [data, setData] = useState<NearbyStoresResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const categoryIdsKey = categoryIds?.join(',') ?? '';

  useEffect(() => {
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

    setData(null);
    setIsLoading(true);
    setErrorMessage(null);

    void getNearbyStores(requestParams, controller.signal)
      .then((responseData) => {
        if (!controller.signal.aborted) {
          setData(responseData);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [categoryIdsKey, keyword, latitude, longitude, radius]);

  return { data, errorMessage, isLoading };
}
