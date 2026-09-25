import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getStoreGachas } from './api/getStoreGachas';
import type { StoreGachaPage } from './api/storeGachaType';

type SettledStoreGachaState = Extract<
  AsyncState<StoreGachaPage>,
  { status: 'success' | 'error' }
>;

interface StoreGachaRequest {
  storeId: number;
  page: number;
  size: number;
  attempt: number;
}

interface StoreGachaSnapshot {
  request: StoreGachaRequest;
  state: SettledStoreGachaState;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
}

export interface UseStoreGachasResult {
  storeGachaState: AsyncState<StoreGachaPage>;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  retryStoreGachas: () => void;
  loadMoreStoreGachas: () => void;
}

const FIRST_PAGE = 0;
const PAGE_SIZE = 8;
const DEFAULT_ERROR_MESSAGE = '매장 보유 가챠를 불러오지 못했습니다.';
const LOADING_STATE: AsyncState<StoreGachaPage> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

function mergeStoreGachaPages(
  currentPage: StoreGachaPage,
  nextPage: StoreGachaPage,
): StoreGachaPage {
  const loadedGachaIds = new Set(
    currentPage.gachas.map((gacha) => gacha.gachaId),
  );
  const newGachas = nextPage.gachas.filter(
    (gacha) => !loadedGachaIds.has(gacha.gachaId),
  );

  return {
    gachas: [...currentPage.gachas, ...newGachas],
    totalCount: nextPage.totalCount,
    page: nextPage.page,
    totalPages: nextPage.totalPages,
  };
}

async function loadStoreGachas(
  request: Pick<StoreGachaRequest, 'storeId' | 'page' | 'size'>,
  signal: AbortSignal,
): Promise<SettledStoreGachaState> {
  try {
    const data = await getStoreGachas(request, signal);

    return { status: 'success', data, errorMessage: null };
  } catch (error: unknown) {
    return {
      status: 'error',
      data: null,
      errorMessage: getErrorMessage(error),
    };
  }
}

export function useStoreGachas(storeId: number): UseStoreGachasResult {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<StoreGachaSnapshot | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const request = useMemo<StoreGachaRequest>(
    () => ({ storeId, page: FIRST_PAGE, size: PAGE_SIZE, attempt }),
    [attempt, storeId],
  );
  const retryStoreGachas = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const activeRequest = request;
    const controller = new AbortController();

    async function applyStoreGachaResult() {
      const nextState = await loadStoreGachas(activeRequest, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      setSnapshot({
        request: activeRequest,
        state: nextState,
        isLoadingMore: false,
        loadMoreErrorMessage: null,
      });
    }

    void applyStoreGachaResult();

    return () => {
      controller.abort();
    };
  }, [request]);

  useEffect(
    () => () => {
      loadMoreControllerRef.current?.abort();
      loadMoreControllerRef.current = null;
    },
    [request],
  );

  const currentSnapshot = snapshot?.request === request ? snapshot : null;
  const canLoadMore =
    currentSnapshot?.state.status === 'success' &&
    currentSnapshot.state.data.gachas.length <
      currentSnapshot.state.data.totalCount;

  const loadMoreStoreGachas = useCallback(() => {
    if (
      !currentSnapshot ||
      currentSnapshot.state.status !== 'success' ||
      !canLoadMore ||
      currentSnapshot.isLoadingMore ||
      loadMoreControllerRef.current
    ) {
      return;
    }

    const activeRequest = request;
    const currentPage = currentSnapshot.state.data;
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    setSnapshot({
      ...currentSnapshot,
      isLoadingMore: true,
      loadMoreErrorMessage: null,
    });

    async function appendNextPage() {
      const nextState = await loadStoreGachas(
        {
          storeId: activeRequest.storeId,
          page: currentPage.page + 1,
          size: activeRequest.size,
        },
        controller.signal,
      );

      if (controller.signal.aborted) {
        return;
      }

      setSnapshot((latestSnapshot) => {
        if (
          latestSnapshot?.request !== activeRequest ||
          latestSnapshot.state.status !== 'success'
        ) {
          return latestSnapshot;
        }

        if (nextState.status === 'error') {
          return {
            ...latestSnapshot,
            isLoadingMore: false,
            loadMoreErrorMessage: nextState.errorMessage,
          };
        }

        return {
          request: activeRequest,
          state: {
            status: 'success',
            data: mergeStoreGachaPages(
              latestSnapshot.state.data,
              nextState.data,
            ),
            errorMessage: null,
          },
          isLoadingMore: false,
          loadMoreErrorMessage: null,
        };
      });

      if (loadMoreControllerRef.current === controller) {
        loadMoreControllerRef.current = null;
      }
    }

    void appendNextPage();
  }, [canLoadMore, currentSnapshot, request]);

  if (!currentSnapshot) {
    return {
      storeGachaState: LOADING_STATE,
      hasMore: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      retryStoreGachas,
      loadMoreStoreGachas,
    };
  }

  return {
    storeGachaState: currentSnapshot.state,
    hasMore: canLoadMore,
    isLoadingMore: currentSnapshot.isLoadingMore,
    loadMoreErrorMessage: currentSnapshot.loadMoreErrorMessage,
    retryStoreGachas,
    loadMoreStoreGachas,
  };
}
