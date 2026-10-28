import { isApiResponse } from '@/shared/api/isApiResponse';

import type { TradeCategory } from '../tradeCategoryType';

const CATEGORIES_API_PATH = '/api/v1/categories';
const JSON_CONTENT_TYPE = 'application/json';

export function createTradeCategoriesUrl(keyword = ''): string {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return CATEGORIES_API_PATH;
  }

  const searchParams = new URLSearchParams({ keyword: normalizedKeyword });

  return `${CATEGORIES_API_PATH}?${searchParams.toString()}`;
}

export async function getTradeCategories(
  keyword = '',
  signal?: AbortSignal,
): Promise<TradeCategory[]> {
  const response = await fetch(createTradeCategoriesUrl(keyword), {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('카테고리를 불러오지 못했습니다.');
  }

  const responseBody: unknown = await response.json();

  if (!response.ok || !isApiResponse(responseBody)) {
    throw new Error(getErrorMessage(responseBody));
  }

  if (responseBody.code !== 'C000') {
    throw new Error(responseBody.message);
  }

  if (
    typeof responseBody.data !== 'object' ||
    responseBody.data === null ||
    !('items' in responseBody.data) ||
    !Array.isArray(responseBody.data.items)
  ) {
    throw new Error('카테고리 응답 형식이 올바르지 않습니다.');
  }

  return responseBody.data.items.map(parseTradeCategory);
}

function parseTradeCategory(value: unknown): TradeCategory {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('categoryId' in value) ||
    typeof value.categoryId !== 'number' ||
    !Number.isSafeInteger(value.categoryId) ||
    value.categoryId <= 0 ||
    !('name' in value) ||
    typeof value.name !== 'string'
  ) {
    throw new Error('카테고리 응답 형식이 올바르지 않습니다.');
  }

  return { categoryId: value.categoryId, name: value.name };
}

function getErrorMessage(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message;
  }

  return '카테고리를 불러오지 못했습니다.';
}
