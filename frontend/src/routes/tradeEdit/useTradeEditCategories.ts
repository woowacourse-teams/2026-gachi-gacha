import { useCallback, useEffect, useState } from 'react';

import { getTradeCategories } from '@/domains/trade/api/getTradeCategories';
import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

const LOADING_STATE: AsyncState<TradeCategory[]> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useTradeEditCategories() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] =
    useState<AsyncState<TradeCategory[]>>(LOADING_STATE);
  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setState(LOADING_STATE);

    async function loadCategories() {
      try {
        const categories = await getTradeCategories('', controller.signal);

        if (!controller.signal.aborted) {
          setState({ status: 'success', data: categories, errorMessage: null });
        }
      } catch (error: unknown) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        setState({
          status: 'error',
          data: null,
          errorMessage:
            error instanceof Error
              ? error.message
              : '카테고리를 불러오지 못했습니다.',
        });
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, [attempt]);

  return { state, retry };
}
