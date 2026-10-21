import { getApiBaseUrl } from '../../config/api';
import type { StoreDetail, StoreGacha, StoreGachaPage, StoreImage } from './storeTypes';

const DEFAULT_DETAIL_ERROR = '매장 상세 정보를 불러오지 못했습니다.';
const DEFAULT_GACHA_ERROR = '매장 보유 가챠를 불러오지 못했습니다.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function isNonNegativeIntegerOrNull(value: unknown): value is number | null {
  return value === null || (isSafeInteger(value) && value >= 0);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isStoreImage(value: unknown): value is StoreImage {
  return (
    isRecord(value) &&
    isSafeInteger(value.storeImageId) &&
    value.storeImageId > 0 &&
    typeof value.imageUrl === 'string'
  );
}

function isStoreDetail(value: unknown): value is StoreDetail {
  return (
    isRecord(value) &&
    isSafeInteger(value.storeId) &&
    value.storeId > 0 &&
    typeof value.name === 'string' &&
    typeof value.address === 'string' &&
    isNullableString(value.businessHours) &&
    isNullableString(value.thumbnailUrl) &&
    Array.isArray(value.images) &&
    value.images.every(isStoreImage) &&
    isNullableString(value.phoneNumber) &&
    isNullableString(value.instagramId) &&
    isNullableString(value.paymentMethods) &&
    Array.isArray(value.facilities) &&
    value.facilities.every((facility) => typeof facility === 'string') &&
    isNonNegativeIntegerOrNull(value.gachaMachineAmount) &&
    isNonNegativeIntegerOrNull(value.kujiAmount) &&
    isNonNegativeIntegerOrNull(value.coinPrice) &&
    isNonNegativeIntegerOrNull(value.gachaPriceMin) &&
    isNonNegativeIntegerOrNull(value.gachaPriceMax) &&
    isNonNegativeIntegerOrNull(value.kujiPriceMin) &&
    isNonNegativeIntegerOrNull(value.kujiPriceMax) &&
    isNonNegativeIntegerOrNull(value.selectGachaPriceMin) &&
    isNonNegativeIntegerOrNull(value.selectGachaPriceMax) &&
    typeof value.hasRandomBox === 'boolean' &&
    (typeof value.hasSelectGacha === 'boolean' || value.hasSelectGacha === null) &&
    typeof value.updatedAt === 'string'
  );
}

function isStoreGacha(value: unknown): value is Omit<StoreGacha, 'gachaName'> & { gachaName: string | null } {
  return (
    isRecord(value) &&
    isSafeInteger(value.gachaId) &&
    value.gachaId > 0 &&
    (typeof value.gachaName === 'string' || value.gachaName === null) &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null)
  );
}

function readMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === 'string' ? value.message : fallback;
}

async function requestJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { signal });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const body: unknown = await response.json();
  if (!response.ok) throw new Error(readMessage(body, '요청을 처리하지 못했습니다.'));
  return body;
}

export async function getStoreDetail(storeId: number, signal?: AbortSignal): Promise<StoreDetail> {
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    throw new Error('올바른 매장 ID가 필요합니다.');
  }

  const body = await requestJson(`/api/v1/stores/${storeId}`, signal);
  if (!isRecord(body) || body.code !== 'C000') {
    throw new Error(readMessage(body, DEFAULT_DETAIL_ERROR));
  }
  if (!isStoreDetail(body.data)) {
    throw new Error('매장 상세 응답 형식이 올바르지 않습니다.');
  }

  return body.data;
}

export async function getStoreGachas({
  storeId,
  page = 0,
  signal,
}: {
  storeId: number;
  page?: number;
  signal?: AbortSignal;
}): Promise<StoreGachaPage> {
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    throw new Error('올바른 매장 ID가 필요합니다.');
  }

  const params = new URLSearchParams({ page: String(page), size: '12' });
  const body = await requestJson(`/api/v1/stores/${storeId}/gachas?${params}`, signal);
  if (!isRecord(body) || body.code !== 'C000') {
    throw new Error(readMessage(body, DEFAULT_GACHA_ERROR));
  }

  const data = body.data;
  if (
    !isRecord(data) ||
    !Array.isArray(data.content) ||
    !data.content.every(isStoreGacha) ||
    !isSafeInteger(data.number) ||
    data.number < 0 ||
    !isSafeInteger(data.totalElements) ||
    data.totalElements < 0 ||
    !isSafeInteger(data.totalPages) ||
    data.totalPages < 0
  ) {
    throw new Error('매장 보유 가챠 응답 형식이 올바르지 않습니다.');
  }

  return {
    content: data.content.map(({ gachaId, gachaName, thumbnailUrl }) => ({
      gachaId,
      gachaName: gachaName?.trim() || '이름 미등록',
      thumbnailUrl,
    })),
    pageNumber: data.number,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
  };
}
