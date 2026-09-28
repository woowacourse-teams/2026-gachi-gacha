import { useCallback, useEffect, useReducer, useRef } from 'react';

import {
  categoryGachaFeedReducer,
  INITIAL_CATEGORY_GACHA_FEED_STATE,
} from './categoryGachaFeedReducer';
import { getCategoryGachaPage } from '../../api/getCategoryGachaPage';

export function useInfiniteCategoryGachas(categoryName: string) {
  const [state, dispatch] = useReducer(
    categoryGachaFeedReducer,
    INITIAL_CATEGORY_GACHA_FEED_STATE,
  );
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    isLoadingMoreRef.current = false;

    const fetchCategoryGachas = async () => {
      dispatch({ type: 'initialLoadStarted' });

      try {
        const firstPage = await getCategoryGachaPage({
          categoryName,
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
    };
  }, [categoryName]);

  const loadNextPage = useCallback(() => {
    if (
      state.itemsState.status !== 'success' ||
      isLoadingMoreRef.current ||
      state.nextPage === null
    ) {
      return;
    }

    const nextPage = state.nextPage;
    const controller = new AbortController();

    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    isLoadingMoreRef.current = true;
    dispatch({ type: 'nextPageStarted' });

    const fetchNextPage = async () => {
      try {
        const nextPageData = await getCategoryGachaPage({
          categoryName,
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
  }, [categoryName, state.itemsState.status, state.nextPage]);

  return {
    itemsState: state.itemsState,
    hasNextPage: state.nextPage !== null,
    loadMoreStatus: state.loadMoreStatus,
    loadNextPage,
  };
}
