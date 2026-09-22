import { createNearbyStoreSearchUrl } from './createNearbyStoreSearchUrl';
import type { NearbyStoreSearchParams } from './nearbyStoreSearchParamsType';
import type { NearbyStoresResponseDto } from './nearbyStoresResponseType';
import { parseNearbyStoresResponse } from './parseNearbyStoresResponse';

const JSON_CONTENT_TYPE = 'application/json';

export async function getNearbyStores(
  params: NearbyStoreSearchParams,
  signal?: AbortSignal,
): Promise<NearbyStoresResponseDto> {
  const response = await fetch(createNearbyStoreSearchUrl(params), {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const responseBody: unknown = await response.json();

  return parseNearbyStoresResponse(responseBody);
}
