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

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsExactCategory(title: string, categoryName: string): boolean {
  const separator = String.raw`[\s·,./#()[\]{}<>|:+_-]`;
  const pattern = new RegExp(
    `(^|${separator})${escapeRegularExpression(categoryName)}(?=$|${separator})`,
    'iu',
  );

  return pattern.test(title);
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
    containsExactCategory(title, categoryName),
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
