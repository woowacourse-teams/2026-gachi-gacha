import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTrades } from '@/domains/trade/api/getTrades';
import type { TradeSummaryPage } from '@/domains/trade/tradeSummaryType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

const DEFAULT_ERROR_MESSAGE = '교환 게시글을 불러오지 못했습니다.';
const PAGE_SIZE = 20;
const LATEST_SORT = 'createdAt,desc';
const LOADING_STATE: AsyncState<TradeSummaryPage> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useTrades(keyword: string) {
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] =
    useState<AsyncState<TradeSummaryPage>>(LOADING_STATE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const normalizedKeyword = keyword.trim();
  const request = useMemo(
    () => ({ keyword: normalizedKeyword, attempt }),
    [attempt, normalizedKeyword],
  );
  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    setState(LOADING_STATE);
    setIsLoadingMore(false);
    setLoadMoreError(null);

    async function loadTrades() {
      try {
        const data = await getTrades({
          keyword: request.keyword,
          page: 0,
          size: PAGE_SIZE,
          sort: LATEST_SORT,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'success', data, errorMessage: null });
      } catch (error: unknown) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        setState({
          status: 'error',
          data: null,
          errorMessage:
            error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        });
      }
    }

    void loadTrades();

    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [request]);

  const hasMore =
    state.status === 'success' &&
    state.data.pageNumber + 1 < state.data.totalPages;

  const loadMore = useCallback(async () => {
    if (state.status !== 'success' || isLoadingMore || !hasMore) {
      return;
    }

    const controller = new AbortController();
    const nextPage = state.data.pageNumber + 1;

    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const data = await getTrades({
        keyword: normalizedKeyword,
        page: nextPage,
        size: PAGE_SIZE,
        sort: LATEST_SORT,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setState((currentState) => {
        if (currentState.status !== 'success') {
          return currentState;
        }

        const existingTradeIds = new Set(
          currentState.data.content.map((trade) => trade.tradeId),
        );
        const newTrades = data.content.filter(
          (trade) => !existingTradeIds.has(trade.tradeId),
        );

        return {
          status: 'success',
          data: {
            ...data,
            content: [...currentState.data.content, ...newTrades],
          },
          errorMessage: null,
        };
      });
    } catch (error: unknown) {
      if (controller.signal.aborted || isAbortError(error)) {
        return;
      }

      setLoadMoreError(
        error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, normalizedKeyword, state]);

  return {
    state,
    retry,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
  };
}
