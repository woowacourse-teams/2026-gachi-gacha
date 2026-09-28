import { isApiResponse } from '@/shared/api/isApiResponse';

import {
  TRADE_STATUSES,
  type TradeStatus,
  type TradeSummary,
  type TradeSummaryPage,
} from '../tradeSummaryType';

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
  return (
    typeof value === 'string' &&
    TRADE_STATUSES.some((status) => status === value)
  );
}

function isTradeSummary(value: unknown): value is TradeSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isInteger(value.tradeId) &&
    isInteger(value.memberId) &&
    typeof value.title === 'string' &&
    isTradeStatus(value.status) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isNullableString(value.thumbnailUrl) &&
    isNullableString(value.tradePlace) &&
    typeof value.createdAt === 'string'
  );
}

function parseTradeSummaryPage(value: unknown): TradeSummaryPage {
  if (!isRecord(value) || !Array.isArray(value.content)) {
    throw new Error('내 교환글 응답 형식이 올바르지 않습니다.');
  }

  if (!value.content.every(isTradeSummary)) {
    throw new Error('내 교환글 항목 형식이 올바르지 않습니다.');
  }

  const pageNumber = value.number;
  const pageSize = value.size;
  const totalElements = value.totalElements;
  const totalPages = value.totalPages;

  if (
    !isInteger(pageNumber) ||
    !isInteger(pageSize) ||
    !isInteger(totalElements) ||
    !isInteger(totalPages)
  ) {
    throw new Error('내 교환글 페이지 정보가 올바르지 않습니다.');
  }

  return {
    content: value.content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
  };
}

export function parseTradeSummaryPageResponse(
  value: unknown,
): TradeSummaryPage {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  return parseTradeSummaryPage(value.data);
}
