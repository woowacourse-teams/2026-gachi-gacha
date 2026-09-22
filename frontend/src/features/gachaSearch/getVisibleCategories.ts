const MAX_VISIBLE_CATEGORIES = 2;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getRelevance(category: string, query: string): number {
  const normalizedCategory = normalize(category);
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedCategory === normalizedQuery) {
    return 4;
  }

  if (normalizedCategory.startsWith(normalizedQuery)) {
    return 3;
  }

  if (normalizedCategory.includes(normalizedQuery)) {
    return 2;
  }

  return normalizedQuery.includes(normalizedCategory) ? 1 : 0;
}

export function getVisibleCategories(
  categories: readonly string[],
  query: string,
): readonly string[] {
  return categories
    .map((category, index) => ({
      category,
      index,
      relevance: getRelevance(category, query),
    }))
    .sort(
      (left, right) =>
        right.relevance - left.relevance || left.index - right.index,
    )
    .slice(0, MAX_VISIBLE_CATEGORIES)
    .map(({ category }) => category);
}
