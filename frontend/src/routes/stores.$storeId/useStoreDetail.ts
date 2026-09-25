import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getStoreDetail } from './api/getStoreDetail';
import type { StoreDetailResponseDto } from './api/storeDetailResponseType';

type SettledStoreDetailState = Extract<
  AsyncState<StoreDetailResponseDto>,
  { status: 'success' | 'error' }
>;

interface StoreDetailRequest {
  storeId: number;
  attempt: number;
}

interface StoreDetailSnapshot {
  request: StoreDetailRequest;
  state: SettledStoreDetailState;
}

export interface UseStoreDetailResult {
  storeDetailState: AsyncState<StoreDetailResponseDto>;
  retryStoreDetail: () => void;
}

const DEFAULT_ERROR_MESSAGE = '매장 정보를 불러오지 못했습니다.';
const IDLE_STATE: AsyncState<StoreDetailResponseDto> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: AsyncState<StoreDetailResponseDto> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

async function loadStoreDetail(
  storeId: number,
  signal: AbortSignal,
): Promise<SettledStoreDetailState> {
  try {
    const data = await getStoreDetail(storeId, signal);

    return { status: 'success', data, errorMessage: null };
  } catch (error: unknown) {
    return {
      status: 'error',
      data: null,
      errorMessage: getErrorMessage(error),
    };
  }
}

export function useStoreDetail(storeId: number | null): UseStoreDetailResult {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<StoreDetailSnapshot | null>(null);
  const request = useMemo<StoreDetailRequest | null>(
    () => (storeId === null ? null : { storeId, attempt }),
    [attempt, storeId],
  );
  const retryStoreDetail = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    if (!request) {
      return;
    }

    const activeRequest = request;
    const controller = new AbortController();

    async function applyStoreDetailResult() {
      const nextState = await loadStoreDetail(
        activeRequest.storeId,
        controller.signal,
      );

      if (controller.signal.aborted) {
        return;
      }

      setSnapshot({ request: activeRequest, state: nextState });
    }

    void applyStoreDetailResult();

    return () => {
      controller.abort();
    };
  }, [request]);

  if (!request) {
    return { storeDetailState: IDLE_STATE, retryStoreDetail };
  }

  if (snapshot?.request !== request) {
    return { storeDetailState: LOADING_STATE, retryStoreDetail };
  }

  return { storeDetailState: snapshot.state, retryStoreDetail };
}
