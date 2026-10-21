import Constants from 'expo-constants';

import {
  TRADE_STATUSES,
  type TradeStatus,
  type TradeSummary,
  type TradeSummaryPage,
} from './tradeTypes';

const DEFAULT_ERROR_MESSAGE = '교환 게시글을 불러오지 못했습니다.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTradeStatus(value: unknown): value is TradeStatus {
  return typeof value === 'string' && TRADE_STATUSES.some((status) => status === value);
}

function isTradeSummary(value: unknown): value is TradeSummary {
  if (!isRecord(value)) return false;
  const place = value.tradePlace;

  return (
    isInteger(value.tradeId) &&
    isInteger(value.memberId) &&
    typeof value.title === 'string' &&
    isTradeStatus(value.status) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isNullableString(value.thumbnailUrl) &&
    (place === null ||
      (isRecord(place) &&
        isNullableString(place.name) &&
        typeof place.address === 'string')) &&
    typeof value.createdAt === 'string'
  );
}

function parseResponse(value: unknown): TradeSummaryPage {
  if (!isRecord(value) || typeof value.code !== 'string') {
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }
  if (value.code !== 'C000') {
    throw new Error(typeof value.message === 'string' ? value.message : DEFAULT_ERROR_MESSAGE);
  }

  const data = value.data;
  if (!isRecord(data) || !Array.isArray(data.content) || !data.content.every(isTradeSummary)) {
    throw new Error('교환 게시글 응답 형식이 올바르지 않습니다.');
  }
  if (![data.number, data.size, data.totalElements, data.totalPages].every(isInteger)) {
    throw new Error('교환 게시글 페이지 정보가 올바르지 않습니다.');
  }

  return {
    content: data.content,
    pageNumber: data.number as number,
    pageSize: data.size as number,
    totalElements: data.totalElements as number,
    totalPages: data.totalPages as number,
  };
}

export async function getTrades({
  keyword = '',
  page = 0,
  signal,
}: {
  keyword?: string;
  page?: number;
  signal?: AbortSignal;
} = {}): Promise<TradeSummaryPage> {
  const apiBaseUrl = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/$/, '');
  if (!apiBaseUrl) throw new Error('앱의 서버 주소가 설정되지 않았습니다.');

  const params = new URLSearchParams({ page: String(page), size: '20', sort: 'createdAt,desc' });
  if (keyword.trim()) params.set('keyword', keyword.trim());

  const response = await fetch(`${apiBaseUrl}/api/v1/trades?${params}`, { signal });
  const body: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : DEFAULT_ERROR_MESSAGE);
  }
  if (body === null) throw new Error(DEFAULT_ERROR_MESSAGE);
  return parseResponse(body);
}
