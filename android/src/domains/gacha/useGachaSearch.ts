import { useCallback, useEffect, useRef, useState } from 'react';

import { getGachasByCategoryIds, getMatchingCategoryIds } from './gachaSearchApi';
import type { GachaSearchItem, GachaSearchPage } from './gachaTypes';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export function useGachaSearch(keyword: string) {
  const [items, setItems] = useState<GachaSearchItem[]>([]);
  const [page, setPage] = useState<GachaSearchPage | null>(null);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestIdRef = useRef(0);
  const normalizedKeyword = keyword.trim();

  useEffect(() => {
    if (!normalizedKeyword) {
      requestIdRef.current += 1;
      setItems([]);
      setPage(null);
      setCategoryIds([]);
      setErrorMessage(null);
      setLoadMoreErrorMessage(null);
      setIsLoadingMore(false);
      setStatus('idle');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    setItems([]);
    setPage(null);
    setCategoryIds([]);
    setErrorMessage(null);
    setLoadMoreErrorMessage(null);
    setIsLoadingMore(false);
    setStatus('loading');

    async function loadFirstPage() {
      try {
        const ids = await getMatchingCategoryIds(normalizedKeyword, controller.signal);
        const result = await getGachasByCategoryIds({ categoryIds: ids, signal: controller.signal });

        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setCategoryIds(ids);
        setItems(result.content);
        setPage(result);
        setStatus('success');
      } catch (error: unknown) {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : '가챠 검색 결과를 불러오지 못했습니다.');
        setStatus('error');
      }
    }

    void loadFirstPage();
    return () => {
      controller.abort();
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [attempt, normalizedKeyword]);

  const loadMore = useCallback(async (retrying = false) => {
    if (
      status !== 'success' ||
      !page ||
      page.pageNumber + 1 >= page.totalPages ||
      isLoadingMore ||
      (loadMoreErrorMessage && !retrying) ||
      categoryIds.length === 0
    ) {
      return;
    }

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);
    try {
      const result = await getGachasByCategoryIds({
        categoryIds,
        page: page.pageNumber + 1,
      });
      if (requestIdRef.current !== requestId) return;

      setItems((currentItems) => {
        const loadedIds = new Set(currentItems.map(({ gachaId }) => gachaId));
        return [...currentItems, ...result.content.filter(({ gachaId }) => !loadedIds.has(gachaId))];
      });
      setPage(result);
    } catch (error: unknown) {
      if (requestIdRef.current === requestId) {
        setLoadMoreErrorMessage(error instanceof Error ? error.message : '다음 검색 결과를 불러오지 못했습니다.');
      }
    } finally {
      if (requestIdRef.current === requestId) setIsLoadingMore(false);
    }
  }, [categoryIds, isLoadingMore, loadMoreErrorMessage, page, status]);

  return {
    items,
    status,
    totalCount: page?.totalElements ?? 0,
    errorMessage,
    isLoadingMore,
    loadMoreErrorMessage,
    hasMore: Boolean(page && page.pageNumber + 1 < page.totalPages),
    retry: () => setAttempt((value) => value + 1),
    loadMore,
    retryLoadMore: () => loadMore(true),
  };
}
