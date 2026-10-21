import { useCallback, useEffect, useRef, useState } from 'react';

import { getTrades } from './tradeApi';
import type { TradeStatus, TradeSummary, TradeSummaryPage } from './tradeTypes';

export function useTrades(keyword: string, tradeStatus: TradeStatus | null) {
  const [items, setItems] = useState<TradeSummary[]>([]);
  const [page, setPage] = useState<TradeSummaryPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadFirstPage = useCallback(async (refreshing = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    refreshing ? setIsRefreshing(true) : setStatus('loading');
    setIsLoadingMore(false);
    setLoadMoreErrorMessage(null);
    try {
      const result = await getTrades({ keyword, status: tradeStatus ?? undefined });
      if (requestIdRef.current !== requestId) return;
      setItems(result.content);
      setPage(result);
      setErrorMessage(null);
      setLoadMoreErrorMessage(null);
      setStatus('success');
    } catch (error: unknown) {
      if (requestIdRef.current !== requestId) return;
      setErrorMessage(error instanceof Error ? error.message : '교환 게시글을 불러오지 못했습니다.');
      setStatus('error');
    } finally {
      if (requestIdRef.current === requestId) setIsRefreshing(false);
    }
  }, [keyword, tradeStatus]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async (retrying = false) => {
    if (
      !page ||
      page.pageNumber + 1 >= page.totalPages ||
      isLoadingMore ||
      status !== 'success' ||
      (loadMoreErrorMessage && !retrying)
    ) return;

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);
    try {
      const result = await getTrades({
        keyword,
        page: page.pageNumber + 1,
        status: tradeStatus ?? undefined,
      });
      if (requestIdRef.current !== requestId) return;

      setItems((currentItems) => {
        const ids = new Set(currentItems.map(({ tradeId }) => tradeId));
        return [...currentItems, ...result.content.filter(({ tradeId }) => !ids.has(tradeId))];
      });
      setPage(result);
    } catch (error: unknown) {
      if (requestIdRef.current === requestId) {
        setLoadMoreErrorMessage(error instanceof Error ? error.message : '다음 게시글을 불러오지 못했습니다.');
      }
    } finally {
      if (requestIdRef.current === requestId) setIsLoadingMore(false);
    }
  }, [isLoadingMore, keyword, loadMoreErrorMessage, page, status, tradeStatus]);

  return {
    status, items, errorMessage, isRefreshing, isLoadingMore, loadMoreErrorMessage,
    refresh: () => loadFirstPage(true), retry: () => loadFirstPage(), loadMore,
    retryLoadMore: () => loadMore(true),
  };
}
