import { useCallback, useEffect, useRef, useState } from 'react';

import { getTrades } from './tradeApi';
import type { TradeSummary, TradeSummaryPage } from './tradeTypes';

export function useTrades(keyword: string) {
  const [items, setItems] = useState<TradeSummary[]>([]);
  const [page, setPage] = useState<TradeSummaryPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const loadFirstPage = useCallback(async (refreshing = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    refreshing ? setIsRefreshing(true) : setStatus('loading');
    try {
      const result = await getTrades({ keyword });
      if (requestIdRef.current !== requestId) return;
      setItems(result.content);
      setPage(result);
      setErrorMessage(null);
      setStatus('success');
    } catch (error: unknown) {
      if (requestIdRef.current !== requestId) return;
      setErrorMessage(error instanceof Error ? error.message : '교환 게시글을 불러오지 못했습니다.');
      setStatus('error');
    } finally {
      if (requestIdRef.current === requestId) setIsRefreshing(false);
    }
  }, [keyword]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!page || page.pageNumber + 1 >= page.totalPages || isLoadingMore || status !== 'success') return;
    setIsLoadingMore(true);
    try {
      const result = await getTrades({ keyword, page: page.pageNumber + 1 });
      const ids = new Set(items.map(({ tradeId }) => tradeId));
      setItems([...items, ...result.content.filter(({ tradeId }) => !ids.has(tradeId))]);
      setPage(result);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : '다음 게시글을 불러오지 못했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, items, keyword, page, status]);

  return {
    status, items, errorMessage, isRefreshing, isLoadingMore,
    refresh: () => loadFirstPage(true), retry: () => loadFirstPage(), loadMore,
  };
}
