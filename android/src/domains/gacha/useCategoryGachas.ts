import { useCallback, useEffect, useRef, useState } from 'react';

import { getExactCategoryId, getGachasByCategoryIds } from './gachaSearchApi';
import type { GachaSearchItem, GachaSearchPage } from './gachaTypes';

type CategoryFeedStatus = 'loading' | 'success' | 'error';

export function useCategoryGachas(categoryName: string) {
  const [items, setItems] = useState<GachaSearchItem[]>([]);
  const [page, setPage] = useState<GachaSearchPage | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<CategoryFeedStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();

    setItems([]);
    setPage(null);
    setCategoryId(null);
    setErrorMessage(null);
    setLoadMoreErrorMessage(null);
    setIsLoadingMore(false);
    setStatus('loading');

    async function loadFirstPage() {
      try {
        const exactCategoryId = await getExactCategoryId(categoryName, controller.signal);

        if (requestIdRef.current !== requestId || controller.signal.aborted) return;

        if (exactCategoryId === null) {
          setItems([]);
          setPage({ content: [], pageNumber: 0, totalElements: 0, totalPages: 0 });
          setStatus('success');
          return;
        }

        const result = await getGachasByCategoryIds({
          categoryIds: [exactCategoryId],
          signal: controller.signal,
        });

        if (requestIdRef.current !== requestId || controller.signal.aborted) return;

        setCategoryId(exactCategoryId);
        setItems(result.content);
        setPage(result);
        setStatus('success');
      } catch (error: unknown) {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;

        setErrorMessage(
          error instanceof Error ? error.message : '카테고리 가챠를 불러오지 못했습니다.',
        );
        setStatus('error');
      }
    }

    void loadFirstPage();

    return () => {
      controller.abort();
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [attempt, categoryName]);

  const loadMore = useCallback(async (retrying = false) => {
    if (
      status !== 'success' ||
      !page ||
      page.pageNumber + 1 >= page.totalPages ||
      isLoadingMore ||
      (loadMoreErrorMessage && !retrying) ||
      categoryId === null
    ) {
      return;
    }

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);

    try {
      const result = await getGachasByCategoryIds({
        categoryIds: [categoryId],
        page: page.pageNumber + 1,
      });

      if (requestIdRef.current !== requestId) return;

      setItems((currentItems) => {
        const loadedIds = new Set(currentItems.map(({ gachaId }) => gachaId));
        return [
          ...currentItems,
          ...result.content.filter(({ gachaId }) => !loadedIds.has(gachaId)),
        ];
      });
      setPage(result);
    } catch (error: unknown) {
      if (requestIdRef.current === requestId) {
        setLoadMoreErrorMessage(
          error instanceof Error ? error.message : '다음 가챠를 불러오지 못했습니다.',
        );
      }
    } finally {
      if (requestIdRef.current === requestId) setIsLoadingMore(false);
    }
  }, [categoryId, isLoadingMore, loadMoreErrorMessage, page, status]);

  return {
    items,
    status,
    totalCount: page?.totalElements ?? 0,
    errorMessage,
    isLoadingMore,
    loadMoreErrorMessage,
    retry: () => setAttempt((value) => value + 1),
    loadMore,
    retryLoadMore: () => loadMore(true),
  };
}
