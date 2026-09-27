import { useCallback, useEffect, useRef, useState } from 'react';

import type { AsyncState } from '@/types/asyncState';

import { getCategoryGachas } from '../../api/getCategoryGachas';
import { DEFAULT_CATEGORY } from '../../model/categories';
import type { GachaCard } from '../../model/gachaCard';
import { toGachaCard } from '../../model/toGachaCard';

export function useCategoryFeed() {
  const [selectedCategory, selectCategory] = useState(DEFAULT_CATEGORY);
  const [itemsState, setItemsState] = useState<AsyncState<GachaCard[]>>({
    status: 'loading',
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    isLoadingMoreRef.current = false;

    const fetchCategoryGachas = async () => {
      setItemsState({ status: 'loading' });
      setPage(0);
      setTotalPages(0);
      setIsLoadingMore(false);
      setLoadMoreError(false);

      try {
        const firstPage = await getCategoryGachas({
          categoryName: selectedCategory,
          page: 0,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setItemsState({
          status: 'success',
          data: firstPage.content.map(toGachaCard),
        });
        setPage(firstPage.number);
        setTotalPages(firstPage.totalPages);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setItemsState({
          status: 'error',
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    void fetchCategoryGachas();

    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [selectedCategory]);

  const loadNextPage = useCallback(() => {
    if (
      itemsState.status !== 'success' ||
      isLoadingMoreRef.current ||
      page + 1 >= totalPages
    ) {
      return;
    }

    const nextPage = page + 1;
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    const fetchNextPage = async () => {
      try {
        const nextPageData = await getCategoryGachas({
          categoryName: selectedCategory,
          page: nextPage,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setItemsState((currentState) => {
          if (currentState.status !== 'success') return currentState;

          const loadedIds = new Set(currentState.data.map((gacha) => gacha.id));
          const newItems = nextPageData.content
            .map(toGachaCard)
            .filter((gacha) => !loadedIds.has(gacha.id));

          return {
            status: 'success',
            data: [...currentState.data, ...newItems],
          };
        });
        setPage(nextPageData.number);
        setTotalPages(nextPageData.totalPages);
      } catch {
        if (!controller.signal.aborted) setLoadMoreError(true);
      } finally {
        if (loadMoreControllerRef.current === controller) {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    };

    void fetchNextPage();
  }, [itemsState.status, page, selectedCategory, totalPages]);

  return {
    selectedCategory,
    selectCategory,
    itemsState,
    hasNextPage: page + 1 < totalPages,
    isLoadingMore,
    loadMoreError,
    loadNextPage,
  };
}
