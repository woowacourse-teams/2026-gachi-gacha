import type { GachaSearchResult } from '../gachaSearchResultType';
import { createGachaSearchUrl } from './createGachaSearchUrl';
import type { GachaSearchParams } from './gachaSearchParamsType';
import { parseGachaSearchResponse } from './parseGachaSearchResponse';

const JSON_CONTENT_TYPE = 'application/json';

export async function getGachaSearchResults(
  params: GachaSearchParams,
  signal?: AbortSignal,
): Promise<GachaSearchResult> {
  const response = await fetch(createGachaSearchUrl(params), {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const responseBody: unknown = await response.json();

  return parseGachaSearchResponse(responseBody);
}
