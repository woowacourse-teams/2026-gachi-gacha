import { useCallback, useEffect, useMemo, useState } from 'react';

import { getTrades } from '@/domains/trade/api/getTrades';
import type { TradeSummaryPage } from '@/domains/trade/tradeSummaryType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

const DEFAULT_ERROR_MESSAGE = '교환 게시글을 불러오지 못했습니다.';
const PAGE_SIZE = 20;
const LATEST_SORT = 'createdAt,desc';
const LOADING_STATE: AsyncState<TradeSummaryPage> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useTrades(keyword: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] =
    useState<AsyncState<TradeSummaryPage>>(LOADING_STATE);
  const normalizedKeyword = keyword.trim();
  const request = useMemo(
    () => ({ keyword: normalizedKeyword, attempt }),
    [attempt, normalizedKeyword],
  );
  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setState(LOADING_STATE);

    async function loadTrades() {
      try {
        const data = await getTrades({
          keyword: request.keyword,
          page: 0,
          size: PAGE_SIZE,
          sort: LATEST_SORT,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'success', data, errorMessage: null });
      } catch (error: unknown) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        setState({
          status: 'error',
          data: null,
          errorMessage:
            error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        });
      }
    }

    void loadTrades();

    return () => controller.abort();
  }, [request]);

  return { state, retry };
}
