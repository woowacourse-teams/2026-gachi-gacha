const CATEGORIES_API_PATH = '/categories';

export function createCategorySearchUrl(keyword: string): string {
  const searchParams = new URLSearchParams({ keyword: keyword.trim() });

  return `${CATEGORIES_API_PATH}?${searchParams}`;
}
