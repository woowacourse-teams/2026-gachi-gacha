import { parseStoreDetailResponse } from './parseStoreDetailResponse';
import type { StoreDetailResponseDto } from './storeDetailResponseType';

const JSON_CONTENT_TYPE = 'application/json';

function createStoreDetailApiUrl(storeId: number): string {
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    throw new Error('올바른 매장 ID가 필요합니다.');
  }

  return `/api/v1/stores/${storeId}`;
}

export async function getStoreDetail(
  storeId: number,
  signal?: AbortSignal,
): Promise<StoreDetailResponseDto> {
  const response = await fetch(createStoreDetailApiUrl(storeId), {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const responseBody: unknown = await response.json();

  return parseStoreDetailResponse(responseBody);
}
