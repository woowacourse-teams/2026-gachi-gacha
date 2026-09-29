import { apiClient } from '@/shared/api/apiClient';

import { createCategorySearchUrl } from './createCategorySearchUrl';
import { parseCategorySearchResponse } from './parseCategorySearchResponse';

export function getMatchingCategoryIds(
  keyword: string,
  signal?: AbortSignal,
): Promise<readonly number[]> {
  const options: RequestInit = signal ? { signal } : {};

  return apiClient(
    createCategorySearchUrl(keyword),
    parseCategorySearchResponse,
    options,
  );
}
