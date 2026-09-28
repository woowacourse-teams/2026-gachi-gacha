import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { isApiResponse } from '@/shared/api/isApiResponse';

import type { GachaCardPage } from '../model/gachaCardPage';

interface CategoryGachaPageData {
  content: unknown[];
  number: number;
  last: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isCategoryGachaPageData(
  value: unknown,
): value is CategoryGachaPageData {
  if (!isRecord(value)) return false;

  return (
    Array.isArray(value.content) &&
    isNonNegativeSafeInteger(value.number) &&
    typeof value.last === 'boolean'
  );
}

function isGachaProductSummary(value: unknown): value is GachaProductSummary {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.gachaId) &&
    typeof value.name === 'string' &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string')
  );
}

export function parseCategoryGachaPage(value: unknown): GachaCardPage {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isCategoryGachaPageData(value.data)) {
    throw new Error('카테고리 가챠 페이지 응답 형식이 올바르지 않습니다.');
  }

  if (!value.data.content.every(isGachaProductSummary)) {
    throw new Error('카테고리 가챠 정보 형식이 올바르지 않습니다.');
  }

  return {
    items: value.data.content.map(
      ({ gachaId, name, thumbnailUrl, categories }) => ({
        gachaId,
        name,
        thumbnailUrl,
        categories,
      }),
    ),
    nextPage: value.data.last ? null : value.data.number + 1,
  };
}
