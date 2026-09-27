import { apiClient } from './apiClient';
import type { CategoryGachaPageDto } from './categoryGacha.dto';

interface GetCategoryGachasParams {
  categoryName: string;
  page: number;
}

interface GetCategoryGachasOptions {
  signal?: AbortSignal;
}

export function getCategoryGachas(
  { categoryName, page }: GetCategoryGachasParams,
  options: GetCategoryGachasOptions = {},
): Promise<CategoryGachaPageDto> {
  const encodedCategoryName = encodeURIComponent(categoryName);
  const query = new URLSearchParams({
    page: String(page),
  });
  const requestOptions: RequestInit = options.signal
    ? { signal: options.signal }
    : {};

  return apiClient<CategoryGachaPageDto>(
    `/gachas/category/${encodedCategoryName}?${query}`,
    requestOptions,
  );
}
