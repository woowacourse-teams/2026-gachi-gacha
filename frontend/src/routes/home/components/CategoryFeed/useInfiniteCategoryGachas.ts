import { useCallback, useEffect, useReducer, useRef } from 'react';

import {
  categoryGachaFeedReducer,
  INITIAL_CATEGORY_GACHA_FEED_STATE,
} from './categoryGachaFeedReducer';
import { getCategoryGachaPage } from '../../api/getCategoryGachaPage';
import { getCategoryIdByExactName } from '../../api/getCategoryIdByExactName';

export function useInfiniteCategoryGachas(categoryName: string) {
  const [state, dispatch] = useReducer(
    categoryGachaFeedReducer,
    INITIAL_CATEGORY_GACHA_FEED_STATE,
  );
  const categoryIdRef = useRef<number | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    categoryIdRef.current = null;
    isLoadingMoreRef.current = false;

    const fetchCategoryGachas = async () => {
      dispatch({ type: 'initialLoadStarted' });

      try {
        const categoryId = await getCategoryIdByExactName(
          categoryName,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        if (categoryId === null) {
          dispatch({
            type: 'initialLoadSucceeded',
            page: { items: [], nextPage: null },
          });
          return;
        }

        categoryIdRef.current = categoryId;
        const firstPage = await getCategoryGachaPage({
          categoryId,
          page: 0,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        dispatch({ type: 'initialLoadSucceeded', page: firstPage });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        dispatch({
          type: 'initialLoadFailed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    void fetchCategoryGachas();

    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
      categoryIdRef.current = null;
    };
  }, [categoryName]);

  const loadNextPage = useCallback(() => {
    if (
      state.itemsState.status !== 'success' ||
      isLoadingMoreRef.current ||
      state.nextPage === null ||
      categoryIdRef.current === null
    ) {
      return;
    }

    const categoryId = categoryIdRef.current;
    const nextPage = state.nextPage;
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    isLoadingMoreRef.current = true;
    dispatch({ type: 'nextPageStarted' });

    const fetchNextPage = async () => {
      try {
        const nextPageData = await getCategoryGachaPage({
          categoryId,
          page: nextPage,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        dispatch({ type: 'nextPageSucceeded', page: nextPageData });
      } catch {
        if (!controller.signal.aborted) dispatch({ type: 'nextPageFailed' });
      } finally {
        if (loadMoreControllerRef.current === controller) {
          isLoadingMoreRef.current = false;
        }
      }
    };

    void fetchNextPage();
  }, [state.itemsState.status, state.nextPage]);

  return {
    itemsState: state.itemsState,
    hasNextPage: state.nextPage !== null,
    loadMoreStatus: state.loadMoreStatus,
    loadNextPage,
  };
}
