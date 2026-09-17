import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import type { GachaSearchParams } from './api/gachaSearchParamsType';
import { getGachaSearchResults } from './api/getGachaSearchResults';
import type { GachaSearchResult } from './gachaSearchResultType';

type SettledGachaSearchState = Extract<
  AsyncState<GachaSearchResult>,
  { status: 'success' | 'error' }
>;

interface GachaSearchRequest extends GachaSearchParams {
  attempt: number;
}

interface SettledGachaSearchResult {
  request: GachaSearchRequest;
  state: SettledGachaSearchState;
}

const FIRST_PAGE = 0;
const PAGE_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = '가챠 검색 결과를 불러오지 못했습니다.';
const IDLE_STATE: AsyncState<GachaSearchResult> = {
  status: 'idle',
  data: null,
  errorMessage: null,
};
const LOADING_STATE: AsyncState<GachaSearchResult> = {
  status: 'loading',
  data: null,
  errorMessage: null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

async function loadGachaSearch(
  request: GachaSearchRequest,
  signal: AbortSignal,
): Promise<SettledGachaSearchState> {
  try {
    const data = await getGachaSearchResults(
      {
        keyword: request.keyword,
        page: request.page,
        size: request.size,
      },
      signal,
    );

    return { status: 'success', data, errorMessage: null };
  } catch (error: unknown) {
    return {
      status: 'error',
      data: null,
      errorMessage: getErrorMessage(error),
    };
  }
}

export function useGachaSearch(keyword: string) {
  const [attempt, setAttempt] = useState(0);
  const [settledResult, setSettledResult] =
    useState<SettledGachaSearchResult | null>(null);
  const normalizedKeyword = keyword.trim();
  const request = useMemo<GachaSearchRequest | null>(
    () =>
      normalizedKeyword
        ? {
            keyword: normalizedKeyword,
            page: FIRST_PAGE,
            size: PAGE_SIZE,
            attempt,
          }
        : null,
    [attempt, normalizedKeyword],
  );
  const retrySearch = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    if (!request) {
      return;
    }

    const activeRequest = request;
    const controller = new AbortController();

    async function applyGachaSearchResult() {
      const nextState = await loadGachaSearch(activeRequest, controller.signal);

      if (!controller.signal.aborted) {
        setSettledResult({ request: activeRequest, state: nextState });
      }
    }

    void applyGachaSearchResult();

    return () => {
      controller.abort();
    };
  }, [request]);

  if (!request) {
    return { searchState: IDLE_STATE, retrySearch };
  }

  if (settledResult?.request !== request) {
    return { searchState: LOADING_STATE, retrySearch };
  }

  return { searchState: settledResult.state, retrySearch };
}
