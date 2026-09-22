import { useEffect, useMemo, useState } from 'react';

import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { getGachaProductSummary } from '../api/getGachaProductSummary';

type SettledSelectedGachaState = Extract<
  AsyncState<GachaProductSummary>,
  { status: 'success' | 'error' }
>;

interface SelectedGachaRequest {
  gachaId: number;
}

interface SettledSelectedGachaResult {
  request: SelectedGachaRequest;
  state: SettledSelectedGachaState;
}

const DEFAULT_ERROR_MESSAGE = '선택한 가챠 정보를 불러오지 못했습니다.';
const IDLE_STATE: AsyncState<GachaProductSummary> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: AsyncState<GachaProductSummary> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

async function loadSelectedGacha(
  request: SelectedGachaRequest,
  signal: AbortSignal,
): Promise<SettledSelectedGachaState> {
  try {
    const data = await getGachaProductSummary(request.gachaId, signal);

    return { status: 'success', data, errorMessage: null };
  } catch (error: unknown) {
    return {
      status: 'error',
      data: null,
      errorMessage: getErrorMessage(error),
    };
  }
}

export function useSelectedGacha(
  gachaId: number | null,
): AsyncState<GachaProductSummary> {
  const [settledResult, setSettledResult] =
    useState<SettledSelectedGachaResult | null>(null);
  const request = useMemo<SelectedGachaRequest | null>(
    () => (gachaId === null ? null : { gachaId }),
    [gachaId],
  );

  useEffect(() => {
    if (!request) {
      return;
    }

    const activeRequest = request;
    const controller = new AbortController();

    async function applySelectedGachaResult() {
      const nextState = await loadSelectedGacha(
        activeRequest,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setSettledResult({ request: activeRequest, state: nextState });
      }
    }

    void applySelectedGachaResult();

    return () => {
      controller.abort();
    };
  }, [request]);

  if (!request) {
    return IDLE_STATE;
  }

  if (settledResult?.request !== request) {
    return LOADING_STATE;
  }

  return settledResult.state;
}
