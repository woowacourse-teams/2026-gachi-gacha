import { apiClient } from '@/shared/api/apiClient';

import type { Category } from '../categoryType';
import { parseCategoriesResponse } from './parseCategoriesResponse';

const CATEGORIES_API_PATH = '/categories';

export function createCategoriesUrl(keyword = ''): string {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return CATEGORIES_API_PATH;
  }

  const searchParams = new URLSearchParams({ keyword: normalizedKeyword });

  return `${CATEGORIES_API_PATH}?${searchParams}`;
}

export function getCategories(
  keyword = '',
  signal?: AbortSignal,
): Promise<readonly Category[]> {
  const options: RequestInit = signal ? { signal } : {};

  return apiClient(
    createCategoriesUrl(keyword),
    parseCategoriesResponse,
    options,
  );
}
