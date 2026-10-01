import { getCategories } from '@/domains/category/api/getCategories';

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase('ko-KR');
}

export async function getCategoryIdByExactName(
  categoryName: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const categories = await getCategories(categoryName, signal);
  const normalizedCategoryName = normalizeCategoryName(categoryName);
  const exactCategory = categories.find(
    ({ name }) => normalizeCategoryName(name) === normalizedCategoryName,
  );

  return exactCategory?.categoryId ?? null;
}
