import type { TradeStatus, TradeSummaryPage } from '../tradeSummaryType';
import { parseTradeSummaryPageResponse } from './parseTradeSummaryPageResponse';

const JSON_CONTENT_TYPE = 'application/json';

export interface GetTradesOptions {
  keyword?: string;
  categoryIds?: number[];
  status?: TradeStatus;
  page?: number;
  size?: number;
  sort?: string;
  signal?: AbortSignal;
}

export function createTradesUrl({
  keyword,
  categoryIds,
  status,
  page = 0,
  size = 20,
  sort = 'createdAt,desc',
}: Omit<GetTradesOptions, 'signal'> = {}): string {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const normalizedKeyword = keyword?.trim();

  if (normalizedKeyword) {
    searchParams.set('keyword', normalizedKeyword);
  }

  if (categoryIds?.length) {
    searchParams.set('categoryIds', categoryIds.join(','));
  }

  if (status) {
    searchParams.set('status', status);
  }

  return `/api/v1/trades?${searchParams.toString()}`;
}

export async function getTrades({
  signal,
  ...params
}: GetTradesOptions = {}): Promise<TradeSummaryPage> {
  const response = await fetch(createTradesUrl(params), {
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

  return parseTradeSummaryPageResponse(responseBody);
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
