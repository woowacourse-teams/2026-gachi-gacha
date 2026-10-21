import { getApiBaseUrl } from '../../config/api';
import {
  TRADE_STATUSES,
  type TradeStatus,
  type TradeDetail,
  type TradePlace,
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

function isTradePlace(value: unknown): value is TradePlace {
  return isRecord(value) && isNullableString(value.name) &&
    typeof value.address === 'string' && typeof value.latitude === 'number' &&
    typeof value.longitude === 'number';
}

function isTradeDetail(value: unknown): value is TradeDetail {
  return isRecord(value) && isInteger(value.tradeId) && value.tradeId > 0 &&
    isInteger(value.memberId) && value.memberId > 0 && typeof value.title === 'string' &&
    isNullableString(value.description) && isNullableString(value.desiredProduction) &&
    Array.isArray(value.categories) && value.categories.every((item) => typeof item === 'string') &&
    isTradeStatus(value.status) && (value.purchaseStore === null || isTradePlace(value.purchaseStore)) &&
    (value.tradePlace === null || isTradePlace(value.tradePlace)) &&
    isNullableString(value.availableTime) && Array.isArray(value.imageUrls) &&
    value.imageUrls.every((item) => typeof item === 'string') &&
    typeof value.createdAt === 'string' && typeof value.updatedAt === 'string';
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
  const apiBaseUrl = getApiBaseUrl();

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

export async function getTradeDetail(tradeId: number, signal?: AbortSignal): Promise<TradeDetail> {
  if (!Number.isSafeInteger(tradeId) || tradeId <= 0) throw new Error('올바른 교환 게시글 ID가 필요합니다.');
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/api/v1/trades/${tradeId}`, { signal });
  const body: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json() : null;
  if (!response.ok) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : DEFAULT_ERROR_MESSAGE);
  }
  if (!isRecord(body) || body.code !== 'C000' || !isTradeDetail(body.data)) {
    throw new Error('교환 게시글 응답 형식이 올바르지 않습니다.');
  }
  return body.data;
}
