import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getMyTrades } from '@/domains/trade/api/getMyTrades';
import type {
  TradeStatus,
  TradeSummaryPage,
} from '@/domains/trade/tradeSummaryType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

export type MyTradeStatusFilter = 'ALL' | TradeStatus;

const PAGE_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = '내 교환글을 불러오지 못했습니다.';
const LOADING_STATE: AsyncState<TradeSummaryPage> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useMyTradesList(statusFilter: MyTradeStatusFilter) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] =
    useState<AsyncState<TradeSummaryPage>>(LOADING_STATE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const request = useMemo(
    () => ({ statusFilter, attempt }),
    [attempt, statusFilter],
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
        const data = await getMyTrades({
          page: 0,
          size: PAGE_SIZE,
          ...(request.statusFilter === 'ALL'
            ? {}
            : { status: request.statusFilter }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        captureAnalyticsEvent('mypage_trade_list_load_completed', {
          status: request.statusFilter,
          outcome: 'success',
          result_count: data.content.length,
          total_count: data.totalElements,
        });
        setState({ status: 'success', data, errorMessage: null });
      } catch (error: unknown) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        captureAnalyticsEvent('mypage_trade_list_load_completed', {
          status: request.statusFilter,
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
    captureAnalyticsEvent('mypage_trade_list_more_requested', {
      status: statusFilter,
      loaded_item_count: state.data.content.length,
    });

    try {
      const data = await getMyTrades({
        page: nextPage,
        size: PAGE_SIZE,
        ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setState((currentState) => {
        if (currentState.status !== 'success') {
          return currentState;
        }

        const existingIds = new Set(
          currentState.data.content.map((trade) => trade.tradeId),
        );
        const nextTrades = data.content.filter(
          (trade) => !existingIds.has(trade.tradeId),
        );

        return {
          status: 'success',
          data: {
            ...data,
            content: [...currentState.data.content, ...nextTrades],
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
  }, [hasMore, isLoadingMore, state, statusFilter]);

  return {
    state,
    retry,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
  };
}
