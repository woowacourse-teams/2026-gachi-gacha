import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTrades } from '@/domains/trade/api/getTrades';
import type { TradeSummaryPage } from '@/domains/trade/tradeSummaryType';
import { useMemberBlocks } from '@/features/memberSafety/MemberBlockContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import {
  getTradeSortParameter,
  type TradeListFilter,
} from './model/tradeListFilter';

const DEFAULT_ERROR_MESSAGE = '교환 게시글을 불러오지 못했습니다.';
const PAGE_SIZE = 20;
const LOADING_STATE: AsyncState<TradeSummaryPage> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useTrades(
  { keyword, status, sortOrder }: TradeListFilter,
  restoredPage?: TradeSummaryPage,
) {
  const { isMemberBlocked } = useMemberBlocks();
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<AsyncState<TradeSummaryPage>>(
    restoredPage
      ? { status: 'success', data: restoredPage, errorMessage: null }
      : LOADING_STATE,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const normalizedKeyword = keyword.trim();
  const request = useMemo(
    () => ({
      keyword: normalizedKeyword,
      status,
      sort: getTradeSortParameter(sortOrder),
      attempt,
    }),
    [attempt, normalizedKeyword, sortOrder, status],
  );
  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    if (restoredPage && request.attempt === 0) {
      return () => loadMoreControllerRef.current?.abort();
    }

    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    setState(LOADING_STATE);
    setIsLoadingMore(false);
    setLoadMoreError(null);

    async function loadTrades() {
      try {
        const data = await getTrades({
          keyword: request.keyword,
          ...(request.status === null ? {} : { status: request.status }),
          page: 0,
          size: PAGE_SIZE,
          sort: request.sort,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        captureAnalyticsEvent('trade_list_load_completed', {
          query_applied: Boolean(request.keyword),
          outcome: 'success',
          result_count: data.content.length,
          total_count: data.totalElements,
        });

        setState({ status: 'success', data, errorMessage: null });
      } catch (error: unknown) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        captureAnalyticsEvent('trade_list_load_completed', {
          query_applied: Boolean(request.keyword),
          outcome: 'failure',
          result_count: 0,
          total_count: 0,
        });

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
  }, [request, restoredPage]);

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
        keyword: request.keyword,
        ...(request.status === null ? {} : { status: request.status }),
        page: nextPage,
        size: PAGE_SIZE,
        sort: request.sort,
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
  }, [hasMore, isLoadingMore, request, state]);

  const visibleState = useMemo<AsyncState<TradeSummaryPage>>(() => {
    if (state.status !== 'success') {
      return state;
    }

    const content = state.data.content.filter(
      ({ memberId }) => !isMemberBlocked(memberId),
    );

    return {
      ...state,
      data: {
        ...state.data,
        content,
      },
    };
  }, [isMemberBlocked, state]);

  return {
    state: visibleState,
    retry,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
  };
}
