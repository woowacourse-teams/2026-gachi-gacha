import { useEffect, useState } from 'react';

import { getTradeCategories } from '@/domains/trade/api/getTradeCategories';
import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

const SEARCH_DEBOUNCE_MS = 250;
const IDLE_STATE: AsyncState<TradeCategory[]> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: AsyncState<TradeCategory[]> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useTradeCategories(keyword: string) {
  const [state, setState] = useState<AsyncState<TradeCategory[]>>(IDLE_STATE);
  const normalizedKeyword = keyword.trim();

  useEffect(() => {
    if (!normalizedKeyword) {
      setState(IDLE_STATE);
      return;
    }

    const controller = new AbortController();

    setState(LOADING_STATE);

    const timeoutId = window.setTimeout(() => {
      async function loadCategories() {
        try {
          const categories = await getTradeCategories(
            normalizedKeyword,
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setState({
              status: 'success',
              data: categories,
              errorMessage: null,
            });
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
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [normalizedKeyword]);

  return state;
}
