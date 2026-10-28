import { useCallback, useEffect, useState } from 'react';

import { getMyTrades } from './tradeApi';
import type { TradeSummary } from './tradeTypes';

type State = {
  errorMessage: string | null;
  inProgressCount: number;
  recentTrades: TradeSummary[];
  status: 'loading' | 'success' | 'error';
  totalTradeCount: number;
};

const INITIAL_STATE: State = {
  errorMessage: null,
  inProgressCount: 0,
  recentTrades: [],
  status: 'loading',
  totalTradeCount: 0,
};

export function useMyPageTrades(enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setState(INITIAL_STATE);

    Promise.all([
      getMyTrades({ signal: controller.signal, size: 3 }),
      getMyTrades({ signal: controller.signal, size: 1, status: 'IN_PROGRESS' }),
    ])
      .then(([recentPage, inProgressPage]) => {
        if (controller.signal.aborted) return;
        setState({
          errorMessage: null,
          inProgressCount: inProgressPage.totalElements,
          recentTrades: recentPage.content,
          status: 'success',
          totalTradeCount: recentPage.totalElements,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          ...INITIAL_STATE,
          errorMessage:
            error instanceof Error ? error.message : '내 교환글을 불러오지 못했습니다.',
          status: 'error',
        });
      });

    return () => controller.abort();
  }, [attempt, enabled]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  return { ...state, retry };
}
