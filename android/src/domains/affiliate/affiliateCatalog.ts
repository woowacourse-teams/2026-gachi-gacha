import type {
  AffiliateCatalog,
  AffiliateCatalogProduct,
} from './affiliateCatalogType';

type VisibleAffiliateProductsOptions = {
  catalog: AffiliateCatalog;
  categoryName: string;
  now?: Date;
  placementPath: string;
};

type FindMatchingAffiliateCategoryOptions = {
  catalog: AffiliateCatalog;
  categoryNames: readonly string[];
  now?: Date;
  placementPath: string;
  title?: string;
};

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase('ko-KR');
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}

function getKoreanDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find(({ type }) => type === 'year')?.value;
  const month = parts.find(({ type }) => type === 'month')?.value;
  const day = parts.find(({ type }) => type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('한국 기준 날짜를 계산하지 못했습니다.');
  }

  return `${year}-${month}-${day}`;
}

function isActiveOn(
  product: AffiliateCatalogProduct,
  koreanDateKey: string,
): boolean {
  return (
    (!product.activeFrom || product.activeFrom <= koreanDateKey) &&
    (!product.activeUntil || product.activeUntil >= koreanDateKey)
  );
}

export function getVisibleAffiliateProducts({
  catalog,
  categoryName,
  placementPath,
  now = new Date(),
}: VisibleAffiliateProductsOptions): readonly AffiliateCatalogProduct[] {
  const normalizedCategoryName = normalizeCategoryName(categoryName);
  const normalizedPlacementPath = normalizePathname(placementPath);
  const koreanDateKey = getKoreanDateKey(now);

  return [...catalog.items]
    .filter(
      (product) =>
        product.categories.some(
          (category) =>
            normalizeCategoryName(category.name) === normalizedCategoryName,
        ) &&
        product.placementPaths.some(
          (path) => normalizePathname(path) === normalizedPlacementPath,
        ) &&
        isActiveOn(product, koreanDateKey),
    )
    .sort((left, right) => left.order - right.order);
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

export function isAllowedAffiliateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'naver.me';
  } catch {
    return false;
  }
}
