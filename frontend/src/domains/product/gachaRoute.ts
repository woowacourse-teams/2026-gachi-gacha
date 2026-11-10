export function createGachaSearchResultsUrl(gachaId: number): string {
  const searchParams = new URLSearchParams({ gachaId: String(gachaId) });

  return `/map?${searchParams}`;
}

export function createGachaDetailUrl(gachaId: number, name: string): string {
  const params = new URLSearchParams({
    keyword: name.trim() || '이름 미등록',
    tab: 'gacha',
    product: String(gachaId),
  });
  return `/search?${params}`;
}
