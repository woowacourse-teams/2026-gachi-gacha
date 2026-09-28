import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';

import type { TradeStatus, TradeSummaryPage } from '../tradeSummaryType';
import { parseTradeSummaryPageResponse } from './parseTradeSummaryPageResponse';

const JSON_CONTENT_TYPE = 'application/json';

export interface GetMyTradesOptions {
  size?: number;
  status?: TradeStatus;
  signal?: AbortSignal;
}

export async function getMyTrades({
  size = 3,
  status,
  signal,
}: GetMyTradesOptions = {}): Promise<TradeSummaryPage> {
  const searchParams = new URLSearchParams({ size: String(size) });

  if (status) {
    searchParams.set('status', status);
  }

  const response = await authenticatedFetch(
    `/api/v1/trades/me?${searchParams.toString()}`,
    signal ? { signal } : {},
  );
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('내 교환글을 불러오지 못했습니다.');
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      isErrorResponse(responseBody)
        ? responseBody.message
        : '내 교환글을 불러오지 못했습니다.',
    );
  }

  return parseTradeSummaryPageResponse(responseBody);
}

function isErrorResponse(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}
