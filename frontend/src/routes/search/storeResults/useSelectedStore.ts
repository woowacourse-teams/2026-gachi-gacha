import { useCallback, useState } from 'react';

import type { NearbyStoreResponseDto } from '../api/nearbyStoresResponseType';

export interface UseSelectedStoreResult {
  selectedStoreId: number | null;
  selectStore: (storeId: number) => void;
  clearSelectedStore: () => void;
}

export function useSelectedStore(
  stores: readonly NearbyStoreResponseDto[],
): UseSelectedStoreResult {
  const [requestedStoreId, setRequestedStoreId] = useState<number | null>(null);
  const selectedStoreId = stores.some(
    (store) => store.storeId === requestedStoreId,
  )
    ? requestedStoreId
    : null;

  const selectStore = useCallback(
    (storeId: number) => {
      const isAvailableStore = stores.some(
        (store) => store.storeId === storeId,
      );

      if (isAvailableStore) {
        setRequestedStoreId(storeId);
      }
    },
    [stores],
  );

  const clearSelectedStore = useCallback(() => {
    setRequestedStoreId(null);
  }, []);

  return { selectedStoreId, selectStore, clearSelectedStore };
}
