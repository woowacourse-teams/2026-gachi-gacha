import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import type { GachaSearchParams } from './api/gachaSearchParamsType';
import { getGachaSearchResults } from './api/getGachaSearchResults';
import type { GachaSearchResult } from './gachaSearchResultType';

type SettledGachaSearchState = Extract<
  AsyncState<GachaSearchResult>,
  { status: 'success' | 'error' }
>;

interface GachaSearchRequest extends GachaSearchParams {
  attempt: number;
}

interface GachaSearchSnapshot {
  request: GachaSearchRequest;
  state: SettledGachaSearchState;
  lastLoadedPage: number;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
}

const FIRST_PAGE = 0;
const PAGE_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = '가챠 검색 결과를 불러오지 못했습니다.';
const IDLE_STATE: AsyncState<GachaSearchResult> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: AsyncState<GachaSearchResult> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

function mergeSearchResults(
  currentResult: GachaSearchResult,
  nextResult: GachaSearchResult,
): GachaSearchResult {
  const loadedGachaIds = new Set(
    currentResult.products.map((product) => product.gachaId),
  );
  const newProducts = nextResult.products.filter(
    (product) => !loadedGachaIds.has(product.gachaId),
  );

  return {
    products: [...currentResult.products, ...newProducts],
    totalCount: nextResult.totalCount,
  };
}

async function loadGachaSearch(
  params: GachaSearchParams,
  signal: AbortSignal,
): Promise<SettledGachaSearchState> {
  try {
    const data = await getGachaSearchResults(params, signal);

    return { status: 'success', data, errorMessage: null };
  } catch (error: unknown) {
    return {
      status: 'error',
      data: null,
      errorMessage: getErrorMessage(error),
    };
  }
}

export function useGachaSearch(keyword: string) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<GachaSearchSnapshot | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const normalizedKeyword = keyword.trim();
  const request = useMemo<GachaSearchRequest | null>(
    () =>
      normalizedKeyword
        ? {
            keyword: normalizedKeyword,
            page: FIRST_PAGE,
            size: PAGE_SIZE,
            attempt,
          }
        : null,
    [attempt, normalizedKeyword],
  );
  const retrySearch = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    if (!request) {
      return;
    }

    const activeRequest = request;
    const controller = new AbortController();

    async function applyGachaSearchResult() {
      const nextState = await loadGachaSearch(
        {
          keyword: activeRequest.keyword,
          page: activeRequest.page,
          size: activeRequest.size,
        },
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setSnapshot({
          request: activeRequest,
          state: nextState,
          lastLoadedPage: FIRST_PAGE,
          isLoadingMore: false,
          loadMoreErrorMessage: null,
        });
      }
    }

    void applyGachaSearchResult();

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
    currentSnapshot.state.data.products.length <
      currentSnapshot.state.data.totalCount;

  const loadMore = useCallback(() => {
    if (
      !request ||
      !currentSnapshot ||
      currentSnapshot.state.status !== 'success' ||
      !canLoadMore ||
      currentSnapshot.isLoadingMore ||
      loadMoreControllerRef.current
    ) {
      return;
    }

    const activeRequest = request;
    const nextPage = currentSnapshot.lastLoadedPage + 1;
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    setSnapshot({
      ...currentSnapshot,
      isLoadingMore: true,
      loadMoreErrorMessage: null,
    });

    async function appendNextPage() {
      const nextState = await loadGachaSearch(
        {
          keyword: activeRequest.keyword,
          page: nextPage,
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
            data: mergeSearchResults(latestSnapshot.state.data, nextState.data),
            errorMessage: null,
          },
          lastLoadedPage: nextPage,
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

  if (!request) {
    return {
      searchState: IDLE_STATE,
      hasMore: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      retrySearch,
      loadMore,
    };
  }

  if (!currentSnapshot) {
    return {
      searchState: LOADING_STATE,
      hasMore: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      retrySearch,
      loadMore,
    };
  }

  return {
    searchState: currentSnapshot.state,
    hasMore: canLoadMore,
    isLoadingMore: currentSnapshot.isLoadingMore,
    loadMoreErrorMessage: currentSnapshot.loadMoreErrorMessage,
    retrySearch,
    loadMore,
  };
}
