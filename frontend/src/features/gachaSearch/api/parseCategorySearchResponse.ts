import { isApiResponse } from '@/shared/api/isApiResponse';

interface CategoryItem {
  categoryId: number;
  name: string;
}

interface CategoryListData {
  items: readonly unknown[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCategoryItem(value: unknown): value is CategoryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.categoryId === 'number' &&
    Number.isSafeInteger(value.categoryId) &&
    value.categoryId > 0 &&
    typeof value.name === 'string'
  );
}

function isCategoryListData(value: unknown): value is CategoryListData {
  return isRecord(value) && Array.isArray(value.items);
}

export function parseCategorySearchResponse(value: unknown): readonly number[] {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isCategoryListData(value.data)) {
    throw new Error('카테고리 검색 응답 형식이 올바르지 않습니다.');
  }

  if (!value.data.items.every(isCategoryItem)) {
    throw new Error('카테고리 검색 결과 형식이 올바르지 않습니다.');
  }

  return [...new Set(value.data.items.map(({ categoryId }) => categoryId))];
}
