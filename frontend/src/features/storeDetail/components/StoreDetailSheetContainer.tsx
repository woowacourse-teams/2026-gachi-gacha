import { useEffect, useState } from 'react';

import StoreDetailSheet from './StoreDetailSheet';
import { getStoreDetail } from '../api/getStoreDetail';
import { getStoreGachaPage } from '../api/getStoreGachaImageUrls';
import type { BottomSheetState, StoreDetail } from '../model/storeDetail';
import { toStoreDetail } from '../model/toStoreDetail';

interface StoreDetailSheetContainerProps {
  storeId: number | null;
  distanceMeters?: number | undefined;
  state: BottomSheetState;
  onClose: () => void;
  onStateChange: (state: BottomSheetState) => void;
}

type RequestState =
  | { status: 'loading' }
  | { status: 'success'; store: StoreDetail }
  | { status: 'error' };

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

export default function StoreDetailSheetContainer({
  storeId,
  distanceMeters,
  state,
  onClose,
  onStateChange,
}: StoreDetailSheetContainerProps) {
  const [requestState, setRequestState] = useState<RequestState>({
    status: 'loading',
  });
  const [retryCount, setRetryCount] = useState(0);

  const isOpen = storeId !== null && state !== 'closed';

  useEffect(() => {
    if (storeId === null || !isOpen) return;

    const controller = new AbortController();

    setRequestState({ status: 'loading' });

    // 첫 페이지만 받는다. 카탈로그가 크든 작든 시트 여는 시간이 같아야 한다.
    const gachaFirstPagePromise = getStoreGachaPage(storeId, 0, {
      signal: controller.signal,
    })
      .then((page) => ({ ...page, isLoaded: true }))
      .catch((error: unknown) => {
        if (isAbortError(error)) throw error;

        return { imageUrls: [], isLoaded: false, page: 0, totalPages: 0 };
      });

    Promise.all([
      getStoreDetail(storeId, { signal: controller.signal }),
      gachaFirstPagePromise,
    ])
      .then(([dto, gachaCatalog]) => {
        const options = {
          gachaImageUrls: gachaCatalog.imageUrls,
          gachaTotalPages: gachaCatalog.totalPages,
          isGachaCatalogLoaded: gachaCatalog.isLoaded,
        };
        const store =
          distanceMeters === undefined
            ? toStoreDetail(dto, options)
            : toStoreDetail(dto, { ...options, distanceMeters });

        setRequestState({ status: 'success', store });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;

        setRequestState({ status: 'error' });
      });

    return () => controller.abort();
  }, [distanceMeters, isOpen, retryCount, storeId]);

  if (storeId === null) return null;

  if (requestState.status === 'loading') {
    return (
      <StoreDetailSheet
        state={state}
        status="loading"
        onClose={onClose}
        onStateChange={onStateChange}
      />
    );
  }

  if (requestState.status === 'error') {
    return (
      <StoreDetailSheet
        status="error"
        state={state}
        onClose={onClose}
        onRetry={() => setRetryCount((count) => count + 1)}
        onStateChange={onStateChange}
      />
    );
  }

  return (
    <StoreDetailSheet
      status="success"
      state={state}
      store={requestState.store}
      onClose={onClose}
      onStateChange={onStateChange}
    />
  );
}
