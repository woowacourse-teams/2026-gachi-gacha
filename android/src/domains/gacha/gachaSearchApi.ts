import { getApiBaseUrl } from '../../config/api';
import type { GachaSearchItem, GachaSearchPage } from './gachaTypes';

const DEFAULT_ERROR_MESSAGE = '가챠 검색 결과를 불러오지 못했습니다.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function readMessage(value: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  return isRecord(value) && typeof value.message === 'string' ? value.message : fallback;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  return response.json() as Promise<unknown>;
}

function parseCategoryIds(value: unknown): number[] {
  if (!isRecord(value) || value.code !== 'C000') {
    throw new Error(readMessage(value));
  }

  const data = value.data;
  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new Error('카테고리 검색 응답 형식이 올바르지 않습니다.');
  }

  const categoryIds = data.items.map((item) => {
    if (!isRecord(item) || !isNonNegativeInteger(item.categoryId) || item.categoryId === 0) {
      throw new Error('카테고리 검색 결과 형식이 올바르지 않습니다.');
    }
    return item.categoryId;
  });

  return [...new Set(categoryIds)];
}

function isGachaSearchItem(value: unknown): value is GachaSearchItem {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.gachaId) &&
    value.gachaId > 0 &&
    typeof value.name === 'string' &&
    (value.thumbnailUrl === null || typeof value.thumbnailUrl === 'string') &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isNonNegativeInteger(value.storeCount)
  );
}

function parseGachaPage(value: unknown): GachaSearchPage {
  if (!isRecord(value) || value.code !== 'C000') {
    throw new Error(readMessage(value));
  }

  const data = value.data;
  if (
    !isRecord(data) ||
    !Array.isArray(data.content) ||
    !data.content.every(isGachaSearchItem) ||
    !isNonNegativeInteger(data.number) ||
    !isNonNegativeInteger(data.totalElements) ||
    !isNonNegativeInteger(data.totalPages)
  ) {
    throw new Error('가챠 검색 응답 형식이 올바르지 않습니다.');
  }

  return {
    content: data.content,
    pageNumber: data.number,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
  };
}

export async function getMatchingCategoryIds(
  keyword: string,
  signal?: AbortSignal,
): Promise<number[]> {
  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams({ keyword: keyword.trim() });
  const response = await fetch(`${apiBaseUrl}/api/v1/categories?${params}`, { signal });
  const body = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(readMessage(body));
  }

  return parseCategoryIds(body);
}

export async function getGachasByCategoryIds({
  categoryIds,
  page = 0,
  signal,
}: {
  categoryIds: readonly number[];
  page?: number;
  signal?: AbortSignal;
}): Promise<GachaSearchPage> {
  if (categoryIds.length === 0) {
    return { content: [], pageNumber: 0, totalElements: 0, totalPages: 0 };
  }

  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    categoryIds: categoryIds.join(','),
    page: String(page),
    size: '20',
  });
  const response = await fetch(`${apiBaseUrl}/api/v1/gachas?${params}`, { signal });
  const body = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(readMessage(body));
  }

  return parseGachaPage(body);
}
