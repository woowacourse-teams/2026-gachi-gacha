import { useCallback, useEffect, useState } from 'react';

import { getTradeDetail } from '@/domains/trade/api/getTradeDetail';
import { updateTradeStatus } from '@/domains/trade/api/updateTradeStatus';
import type { TradeDetail } from '@/domains/trade/tradeDetailType';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

const LOADING_STATE: AsyncState<TradeDetail> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useTradeDetail(tradeId: number) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<AsyncState<TradeDetail>>(LOADING_STATE);
  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setState(LOADING_STATE);

    async function loadTradeDetail() {
      try {
        const data = await getTradeDetail(tradeId, controller.signal);

        if (!controller.signal.aborted) {
          setState({ status: 'success', data, errorMessage: null });
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
              : '교환 게시글을 불러오지 못했습니다.',
        });
      }
    }

    void loadTradeDetail();

    return () => controller.abort();
  }, [attempt, tradeId]);

  async function changeStatus(status: TradeStatus) {
    const data = await updateTradeStatus({ tradeId, status });

    setState((current) =>
      current.status === 'success' && current.data.tradeId === data.tradeId
        ? { status: 'success', data, errorMessage: null }
        : current,
    );
  }

  return { state, retry, changeStatus };
}
