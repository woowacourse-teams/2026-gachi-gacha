import { useCallback, useEffect, useRef, useState } from 'react';

import { getMyTrades } from './tradeApi';
import type { TradeStatus, TradeSummary, TradeSummaryPage } from './tradeTypes';

export type MyTradeFilter = 'ALL' | TradeStatus;

type State = {
  data: TradeSummaryPage | null;
  errorMessage: string | null;
  status: 'loading' | 'success' | 'error';
};

const PAGE_SIZE = 10;

export function useMyTrades(filter: MyTradeFilter) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({
    data: null,
    errorMessage: null,
    status: 'loading',
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadMoreController.current?.abort();
    setState({ data: null, errorMessage: null, status: 'loading' });
    setIsLoadingMore(false);
    setLoadMoreError(null);

    getMyTrades({
      page: 0,
      signal: controller.signal,
      size: PAGE_SIZE,
      ...(filter === 'ALL' ? {} : { status: filter }),
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, errorMessage: null, status: 'success' });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            data: null,
            errorMessage:
              error instanceof Error ? error.message : '내 교환글을 불러오지 못했습니다.',
            status: 'error',
          });
        }
      });

    return () => {
      controller.abort();
      loadMoreController.current?.abort();
    };
  }, [attempt, filter]);

  const hasMore =
    state.status === 'success' &&
    state.data !== null &&
    state.data.pageNumber + 1 < state.data.totalPages;

  const loadMore = useCallback(async () => {
    if (state.status !== 'success' || !state.data || !hasMore || isLoadingMore) return;

    const controller = new AbortController();
    loadMoreController.current?.abort();
    loadMoreController.current = controller;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const nextPage = await getMyTrades({
        page: state.data.pageNumber + 1,
        signal: controller.signal,
        size: PAGE_SIZE,
        ...(filter === 'ALL' ? {} : { status: filter }),
      });
      if (controller.signal.aborted) return;

      setState((current) => {
        if (current.status !== 'success' || !current.data) return current;
        const ids = new Set(current.data.content.map(({ tradeId }) => tradeId));
        const appended: TradeSummary[] = nextPage.content.filter(
          ({ tradeId }) => !ids.has(tradeId),
        );
        return {
          data: { ...nextPage, content: [...current.data.content, ...appended] },
          errorMessage: null,
          status: 'success',
        };
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        setLoadMoreError(
          error instanceof Error ? error.message : '교환글을 더 불러오지 못했습니다.',
        );
      }
    } finally {
      if (!controller.signal.aborted) setIsLoadingMore(false);
    }
  }, [filter, hasMore, isLoadingMore, state]);

  return {
    hasMore,
    isLoadingMore,
    loadMore,
    loadMoreError,
    retry: () => setAttempt((current) => current + 1),
    state,
  };
}
