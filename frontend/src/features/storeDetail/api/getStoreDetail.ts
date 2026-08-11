import type { ApiResponseDto, StoreDetailDto } from './storeDetail.dto';

interface GetStoreDetailOptions {
  signal?: AbortSignal;
}

export async function getStoreDetail(
  storeId: number,
  options: GetStoreDetailOptions = {},
) {
  const requestOptions: RequestInit = options.signal
    ? { signal: options.signal }
    : {};
  const response = await fetch(`/api/v1/stores/${storeId}`, requestOptions);

  if (!response.ok) {
    throw new Error(`매장 상세 정보 요청에 실패했습니다: ${response.status}`);
  }

  const responseDto = (await response.json()) as ApiResponseDto<StoreDetailDto>;

  return responseDto.data;
}
