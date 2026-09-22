import type { GachaSearchParams } from './gachaSearchParamsType';

const GACHAS_API_PATH = '/api/v1/gachas';

export function createGachaSearchUrl({
  keyword,
  page,
  size,
}: GachaSearchParams): string {
  const searchParams = new URLSearchParams({
    keyword: keyword.trim(),
    page: String(page),
    size: String(size),
  });

  return `${GACHAS_API_PATH}?${searchParams}`;
}
