const SEARCH_KEYWORD_PARAM = 'q';

export function getSearchKeyword(search: string): string {
  const searchParams = new URLSearchParams(search);

  return searchParams.get(SEARCH_KEYWORD_PARAM)?.trim() ?? '';
}
