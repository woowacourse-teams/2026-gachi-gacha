import { useCallback, useEffect, useState } from 'react';

import { getMyTrades } from '@/domains/trade/api/getMyTrades';
import type {
  TradeStatus,
  TradeSummary,
} from '@/domains/trade/tradeSummaryType';

interface MyPageTradesState {
  recentTrades: TradeSummary[];
  totalTradeCount: number;
  inProgressCount: number;
  status: 'loading' | 'success' | 'error';
  errorMessage: string | null;
}

const INITIAL_STATE: MyPageTradesState = {
  recentTrades: [],
  totalTradeCount: 0,
  inProgressCount: 0,
  status: 'loading',
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useMyPageTrades() {
  const [state, setState] = useState<MyPageTradesState>(INITIAL_STATE);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((currentVersion) => currentVersion + 1);
  }, []);

  const applyStatusChange = useCallback(
    (tradeId: number, nextStatus: TradeStatus) => {
      setState((currentState) => {
        const currentTrade = currentState.recentTrades.find(
          (trade) => trade.tradeId === tradeId,
        );

        if (!currentTrade || currentTrade.status === nextStatus) {
          return currentState;
        }

        const inProgressDelta =
          currentTrade.status === 'IN_PROGRESS'
            ? -1
            : nextStatus === 'IN_PROGRESS'
              ? 1
              : 0;

        return {
          ...currentState,
          recentTrades: currentState.recentTrades.map((trade) =>
            trade.tradeId === tradeId
              ? { ...trade, status: nextStatus }
              : trade,
          ),
          inProgressCount: Math.max(
            0,
            currentState.inProgressCount + inProgressDelta,
          ),
        };
      });
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    setState(INITIAL_STATE);

    void Promise.all([
      getMyTrades({ size: 3, signal: controller.signal }),
      getMyTrades({
        size: 1,
        status: 'IN_PROGRESS',
        signal: controller.signal,
      }),
    ])
      .then(([recentTradePage, inProgressTradePage]) => {
        setState({
          recentTrades: recentTradePage.content,
          totalTradeCount: recentTradePage.totalElements,
          inProgressCount: inProgressTradePage.totalElements,
          status: 'success',
          errorMessage: null,
        });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        setState({
          ...INITIAL_STATE,
          status: 'error',
          errorMessage:
            error instanceof Error
              ? error.message
              : '내 교환글을 불러오지 못했습니다.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [requestVersion]);

  return { ...state, retry, applyStatusChange };
}
