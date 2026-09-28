import { apiClient } from '@/shared/api/apiClient';

import { parseCategoryGachaPage } from './parseCategoryGachaPage';
import type { GachaCardPage } from '../model/gachaCardPage';

interface GetCategoryGachaPageParams {
  categoryName: string;
  page: number;
  signal: AbortSignal;
}

export function getCategoryGachaPage({
  categoryName,
  page,
  signal,
}: GetCategoryGachaPageParams): Promise<GachaCardPage> {
  const category = encodeURIComponent(categoryName);

  return apiClient(
    `/gachas/category/${category}?page=${page}`,
    parseCategoryGachaPage,
    { signal },
  );
}
