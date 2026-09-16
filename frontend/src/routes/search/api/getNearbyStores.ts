import { createNearbyStoreSearchUrl } from './createNearbyStoreSearchUrl';
import type { NearbyStoreSearchParams } from './nearbyStoreSearchParamsType';
import type { NearbyStoresResponseDto } from './nearbyStoresResponseType';
import { parseNearbyStoresResponse } from './parseNearbyStoresResponse';

const JSON_CONTENT_TYPE = 'application/json';

// gachaId 필터는 백엔드 협의가 필요한 프론트 제안이다.
// 현재 backend-dev는 이 파라미터를 지원하지 않으므로 실제 연결 전 확인해야 한다.
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
