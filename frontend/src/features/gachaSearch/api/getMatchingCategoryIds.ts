import { getCategories } from '@/domains/category/api/getCategories';

export async function getMatchingCategoryIds(
  keyword: string,
  signal?: AbortSignal,
): Promise<readonly number[]> {
  const categories = await getCategories(keyword, signal);

  return categories.map(({ categoryId }) => categoryId);
}
