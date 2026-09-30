import { isApiResponse } from '@/shared/api/isApiResponse';

import type { TradeDetail, TradePlace } from '../tradeDetailType';
import { TRADE_STATUSES, type TradeStatus } from '../tradeSummaryType';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTradeStatus(value: unknown): value is TradeStatus {
  return (
    typeof value === 'string' &&
    TRADE_STATUSES.some((status) => status === value)
  );
}

function isTradePlace(value: unknown): value is TradePlace {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableString(value.name) &&
    typeof value.address === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number'
  );
}

function isTradeDetail(value: unknown): value is TradeDetail {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.tradeId) &&
    isPositiveInteger(value.memberId) &&
    typeof value.title === 'string' &&
    isNullableString(value.description) &&
    isNullableString(value.desiredProduction) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isTradeStatus(value.status) &&
    (value.purchaseStore === null || isTradePlace(value.purchaseStore)) &&
    (value.tradePlace === null || isTradePlace(value.tradePlace)) &&
    isNullableString(value.availableTime) &&
    Array.isArray(value.imageUrls) &&
    value.imageUrls.every((imageUrl) => typeof imageUrl === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function parseTradeDetailData(value: unknown): TradeDetail {
  if (!isTradeDetail(value)) {
    throw new Error('교환 게시글 응답 형식이 올바르지 않습니다.');
  }

  return value;
}

export function parseTradeDetailResponse(value: unknown): TradeDetail {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  return parseTradeDetailData(value.data);
}
