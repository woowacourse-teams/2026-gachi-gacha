import { isApiResponse } from '@/shared/api/isApiResponse';

import type {
  StoreDetailResponseDto,
  StoreImageResponseDto,
} from './storeDetailResponseType';

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

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isStoreImage(value: unknown): value is StoreImageResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isSafeInteger(value.storeImageId) && typeof value.imageUrl === 'string'
  );
}

function isStoreDetail(value: unknown): value is StoreDetailResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
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
    isStringArray(value.facilities) &&
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
    (typeof value.hasSelectGacha === 'boolean' ||
      value.hasSelectGacha === null) &&
    typeof value.updatedAt === 'string'
  );
}

export function parseStoreDetailResponse(
  value: unknown,
): StoreDetailResponseDto {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isStoreDetail(value.data)) {
    throw new Error('매장 상세 응답 형식이 올바르지 않습니다.');
  }

  return value.data;
}
