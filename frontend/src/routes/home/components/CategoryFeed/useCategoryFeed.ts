import { useCallback, useEffect, useRef, useState } from 'react';

import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getCategoryGachaPage } from '../../api/getCategoryGachaPage';
import { DEFAULT_CATEGORY } from '../../model/categories';

export function useCategoryFeed() {
  const [selectedCategory, selectCategory] = useState(DEFAULT_CATEGORY);
  const [itemsState, setItemsState] = useState<
    AsyncState<GachaProductSummary[]>
  >({
    status: 'loading',
    data: null,
    errorMessage: null,
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
      setItemsState({ status: 'loading', data: null, errorMessage: null });
      setPage(0);
      setTotalPages(0);
      setIsLoadingMore(false);
      setLoadMoreError(false);

      try {
        const firstPage = await getCategoryGachaPage({
          categoryName: selectedCategory,
          page: 0,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setItemsState({
          status: 'success',
          data: firstPage.items,
          errorMessage: null,
        });
        setPage(firstPage.page);
        setTotalPages(firstPage.totalPages);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setItemsState({
          status: 'error',
          data: null,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
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
        const nextPageData = await getCategoryGachaPage({
          categoryName: selectedCategory,
          page: nextPage,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setItemsState((currentState) => {
          if (currentState.status !== 'success') return currentState;

          const loadedIds = new Set(
            currentState.data.map((gacha) => gacha.gachaId),
          );
          const newItems = nextPageData.items.filter(
            (gacha) => !loadedIds.has(gacha.gachaId),
          );

          return {
            status: 'success',
            data: [...currentState.data, ...newItems],
            errorMessage: null,
          };
        });
        setPage(nextPageData.page);
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
