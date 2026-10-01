import { isApiResponse } from '@/shared/api/isApiResponse';

import type {
  GachaSearchProduct,
  GachaSearchResult,
} from '../gachaSearchResultType';

interface GachaSearchPageData {
  content: readonly unknown[];
  totalElements: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isGachaSearchProduct(value: unknown): value is GachaSearchProduct {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isSafeInteger(value.gachaId) &&
    typeof value.name === 'string' &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isNonNegativeSafeInteger(value.storeCount)
  );
}

function isGachaSearchPageData(value: unknown): value is GachaSearchPageData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.content) &&
    isNonNegativeSafeInteger(value.totalElements)
  );
}

export function parseGachaSearchResponse(value: unknown): GachaSearchResult {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isGachaSearchPageData(value.data)) {
    throw new Error('가챠 검색 페이지 응답 형식이 올바르지 않습니다.');
  }

  if (!value.data.content.every(isGachaSearchProduct)) {
    throw new Error('가챠 검색 결과 형식이 올바르지 않습니다.');
  }

  const products = value.data.content.map(
    ({ gachaId, name, thumbnailUrl, categories, storeCount }) => ({
      gachaId,
      name,
      thumbnailUrl,
      categories,
      storeCount,
    }),
  );

  return {
    products,
    totalCount: value.data.totalElements,
  };
}
