import { isApiResponse } from '@/shared/api/isApiResponse';

import type { StoreGachaPage, StoreGachaSummary } from './storeGachaType';

interface StoreGachaPageData {
  content: readonly unknown[];
  totalElements: number;
  number: number;
  totalPages: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isStoreGachaSummary(value: unknown): value is StoreGachaSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isSafeInteger(value.gachaId) &&
    Number(value.gachaId) > 0 &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null)
  );
}

function isStoreGachaPageData(value: unknown): value is StoreGachaPageData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.content) &&
    isNonNegativeSafeInteger(value.totalElements) &&
    isNonNegativeSafeInteger(value.number) &&
    isNonNegativeSafeInteger(value.totalPages)
  );
}

export function parseStoreGachaResponse(value: unknown): StoreGachaPage {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isStoreGachaPageData(value.data)) {
    throw new Error('매장 보유 가챠 페이지 응답 형식이 올바르지 않습니다.');
  }

  if (!value.data.content.every(isStoreGachaSummary)) {
    throw new Error('매장 보유 가챠 응답 형식이 올바르지 않습니다.');
  }

  return {
    gachas: value.data.content.map(({ gachaId, thumbnailUrl }) => ({
      gachaId,
      thumbnailUrl,
    })),
    totalCount: value.data.totalElements,
    page: value.data.number,
    totalPages: value.data.totalPages,
  };
}
