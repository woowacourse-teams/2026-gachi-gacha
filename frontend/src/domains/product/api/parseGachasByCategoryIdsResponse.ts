import { isApiResponse } from '@/shared/api/isApiResponse';

import type {
  GachasByCategoryIdsPage,
  GachaWithStoreCount,
} from '../gachaWithStoreCountType';

interface GachaPageData {
  content: readonly unknown[];
  totalElements: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isGachaWithStoreCount(value: unknown): value is GachaWithStoreCount {
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
    value.categories.every((category) => typeof category === 'string') &&
    isNonNegativeSafeInteger(value.storeCount)
  );
}

function isGachaPageData(value: unknown): value is GachaPageData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.content) &&
    isNonNegativeSafeInteger(value.totalElements)
  );
}

export function parseGachasByCategoryIdsResponse(
  value: unknown,
): GachasByCategoryIdsPage {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isGachaPageData(value.data)) {
    throw new Error('카테고리 가챠 페이지 응답 형식이 올바르지 않습니다.');
  }

  if (!value.data.content.every(isGachaWithStoreCount)) {
    throw new Error('카테고리 가챠 결과 형식이 올바르지 않습니다.');
  }

  return {
    products: value.data.content.map(
      ({ gachaId, name, thumbnailUrl, categories, storeCount }) => ({
        gachaId,
        name,
        thumbnailUrl,
        categories,
        storeCount,
      }),
    ),
    totalCount: value.data.totalElements,
  };
}
