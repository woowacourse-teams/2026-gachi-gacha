import { parseStoreGachaResponse } from './parseStoreGachaResponse';
import type { StoreGachaPage } from './storeGachaType';

const JSON_CONTENT_TYPE = 'application/json';

export interface GetStoreGachasParams {
  storeId: number;
  page: number;
  size: number;
}

function createStoreGachasApiUrl({
  storeId,
  page,
  size,
}: GetStoreGachasParams): string {
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    throw new Error('올바른 매장 ID가 필요합니다.');
  }

  if (!Number.isSafeInteger(page) || page < 0) {
    throw new Error('페이지 번호는 0 이상의 정수여야 합니다.');
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('페이지 크기는 1 이상의 정수여야 합니다.');
  }

  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return `/api/v1/stores/${storeId}/gachas?${searchParams.toString()}`;
}

export async function getStoreGachas(
  params: GetStoreGachasParams,
  signal?: AbortSignal,
): Promise<StoreGachaPage> {
  const response = await fetch(createStoreGachasApiUrl(params), {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const responseBody: unknown = await response.json();

  return parseStoreGachaResponse(responseBody);
}
