import type { GachaSearchPageParams } from './gachaSearchParamsType';

const GACHAS_API_PATH = '/gachas';

export function createGachaSearchUrl({
  categoryIds,
  page,
  size,
}: GachaSearchPageParams): string {
  const searchParams = new URLSearchParams({
    categoryIds: categoryIds.join(','),
    page: String(page),
    size: String(size),
  });

  return `${GACHAS_API_PATH}?${searchParams}`;
}
