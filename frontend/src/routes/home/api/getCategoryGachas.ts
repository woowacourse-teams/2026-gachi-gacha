import { apiClient } from './apiClient';
import type { CategoryGachaPageDto } from './categoryGacha.dto';

interface GetCategoryGachasParams {
  categoryName: string;
  page: number;
  signal: AbortSignal;
}

export function getCategoryGachas({
  categoryName,
  page,
  signal,
}: GetCategoryGachasParams): Promise<CategoryGachaPageDto> {
  const category = encodeURIComponent(categoryName);

  return apiClient<CategoryGachaPageDto>(
    `/gachas/category/${category}?page=${page}`,
    { signal },
  );
}
