export function createGachaSearchResultsUrl(gachaId: number): string {
  const searchParams = new URLSearchParams({ gachaId: String(gachaId) });

  return `/search?${searchParams}`;
}
