import type { AffiliateCatalog } from './affiliateCatalogType';
import { getVisibleAffiliateProducts } from './getVisibleAffiliateProducts';

interface FindMatchingAffiliateCategoryOptions {
  catalog: AffiliateCatalog;
  categoryNames: readonly string[];
  placementPath: string;
  title?: string;
  now?: Date;
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase('ko-KR');
}

function containsCategoryName(title: string, categoryName: string): boolean {
  return normalizeCategoryName(title).includes(
    normalizeCategoryName(categoryName),
  );
}

export function findMatchingAffiliateCategory({
  catalog,
  categoryNames,
  placementPath,
  title = '',
  now,
}: FindMatchingAffiliateCategoryOptions): string | null {
  const availableCategoryNames = [
    ...new Map(
      catalog.items.flatMap((product) =>
        product.categories.map((category) => [
          normalizeCategoryName(category.name),
          category.name,
        ]),
      ),
    ).values(),
  ];
  const availableCategoryByNormalizedName = new Map(
    availableCategoryNames.map((categoryName) => [
      normalizeCategoryName(categoryName),
      categoryName,
    ]),
  );
  const exactCategoryMatches = categoryNames
    .map((categoryName) =>
      availableCategoryByNormalizedName.get(
        normalizeCategoryName(categoryName),
      ),
    )
    .filter((categoryName): categoryName is string => Boolean(categoryName));
  const titleCategoryMatches = availableCategoryNames.filter((categoryName) =>
    containsCategoryName(title, categoryName),
  );
  const categoryCandidates = [
    ...new Set([...exactCategoryMatches, ...titleCategoryMatches]),
  ];

  for (const categoryName of categoryCandidates) {
    if (
      getVisibleAffiliateProducts({
        catalog,
        categoryName,
        placementPath,
        ...(now === undefined ? {} : { now }),
      }).length > 0
    ) {
      return categoryName;
    }
  }

  return null;
}
