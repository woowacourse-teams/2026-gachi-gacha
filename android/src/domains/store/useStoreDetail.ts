import { useCallback, useEffect, useRef, useState } from 'react';

import { getStoreDetail, getStoreGachas } from './storeDetailApi';
import type { StoreDetail, StoreGacha, StoreGachaPage } from './storeTypes';

type DetailState = {
  status: 'loading' | 'success' | 'error';
  data: StoreDetail | null;
  errorMessage: string | null;
};

export function useStoreDetail(storeId: number) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailState>({ status: 'loading', data: null, errorMessage: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null, errorMessage: null });
    getStoreDetail(storeId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, errorMessage: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            data: null,
            errorMessage: error instanceof Error ? error.message : '매장 상세 정보를 불러오지 못했습니다.',
          });
        }
      });
    return () => controller.abort();
  }, [attempt, storeId]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}

type GachaState = {
  status: 'loading' | 'success' | 'error';
  items: StoreGacha[];
  page: StoreGachaPage | null;
  errorMessage: string | null;
  loadMoreErrorMessage: string | null;
};

export function useStoreGachas(storeId: number) {
  const [attempt, setAttempt] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [state, setState] = useState<GachaState>({
    status: 'loading',
    items: [],
    page: null,
    errorMessage: null,
    loadMoreErrorMessage: null,
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    setIsLoadingMore(false);
    setState({ status: 'loading', items: [], page: null, errorMessage: null, loadMoreErrorMessage: null });

    getStoreGachas({ storeId, signal: controller.signal })
      .then((page) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setState({ status: 'success', items: page.content, page, errorMessage: null, loadMoreErrorMessage: null });
      })
      .catch((error: unknown) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setState({
          status: 'error',
          items: [],
          page: null,
          errorMessage: error instanceof Error ? error.message : '매장 보유 가챠를 불러오지 못했습니다.',
          loadMoreErrorMessage: null,
        });
      });

    return () => {
      controller.abort();
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [attempt, storeId]);

  const loadMore = useCallback(async (retrying = false) => {
    if (
      state.status !== 'success' ||
      !state.page ||
      state.page.pageNumber + 1 >= state.page.totalPages ||
      isLoadingMore ||
      (state.loadMoreErrorMessage && !retrying)
    ) return;

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setState((current) => ({ ...current, loadMoreErrorMessage: null }));
    try {
      const nextPage = await getStoreGachas({ storeId, page: state.page.pageNumber + 1 });
      if (requestIdRef.current !== requestId) return;
      setState((current) => {
        const loadedIds = new Set(current.items.map(({ gachaId }) => gachaId));
        return {
          ...current,
          items: [...current.items, ...nextPage.content.filter(({ gachaId }) => !loadedIds.has(gachaId))],
          page: nextPage,
        };
      });
    } catch (error: unknown) {
      if (requestIdRef.current === requestId) {
        setState((current) => ({
          ...current,
          loadMoreErrorMessage: error instanceof Error ? error.message : '다음 가챠를 불러오지 못했습니다.',
        }));
      }
    } finally {
      if (requestIdRef.current === requestId) setIsLoadingMore(false);
    }
  }, [isLoadingMore, state, storeId]);

  return {
    ...state,
    isLoadingMore,
    retry: () => setAttempt((value) => value + 1),
    loadMore,
    retryLoadMore: () => loadMore(true),
  };
}
