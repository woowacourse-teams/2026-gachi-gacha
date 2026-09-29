import type { TradeDetail } from '../tradeDetailType';
import { parseTradeDetailResponse } from './parseTradeDetailResponse';

const JSON_CONTENT_TYPE = 'application/json';

export async function getTradeDetail(
  tradeId: number,
  signal?: AbortSignal,
): Promise<TradeDetail> {
  if (!Number.isSafeInteger(tradeId) || tradeId <= 0) {
    throw new Error('올바른 교환 게시글 ID가 필요합니다.');
  }

  const response = await fetch(`/api/v1/trades/${tradeId}`, {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('교환 게시글을 불러오지 못했습니다.');
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody));
  }

  return parseTradeDetailResponse(responseBody);
}

function getErrorMessage(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message;
  }

  return '교환 게시글을 불러오지 못했습니다.';
}
