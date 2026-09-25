import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { isApiResponse } from '@/shared/api/isApiResponse';

import type { StoreGachaPage } from './storeGachaType';

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

function isStoreGachaSummary(value: unknown): value is GachaProductSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.gachaId === 'number' &&
    Number.isSafeInteger(value.gachaId) &&
    value.gachaId > 0 &&
    typeof value.name === 'string' &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string')
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
    gachas: value.data.content.map(
      ({ gachaId, name, thumbnailUrl, categories }) => ({
        gachaId,
        name,
        thumbnailUrl,
        categories,
      }),
    ),
    totalCount: value.data.totalElements,
    page: value.data.number,
    totalPages: value.data.totalPages,
  };
}
