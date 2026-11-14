import type {
  AffiliateCatalog,
  AffiliateCatalogProduct,
} from './affiliateCatalogType';

interface VisibleAffiliateProductsOptions {
  catalog: AffiliateCatalog;
  categoryName: string;
  placementPath: string;
  now?: Date;
}

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
