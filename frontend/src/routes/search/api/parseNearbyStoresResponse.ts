import { isApiResponse } from '@/shared/api/isApiResponse';

import type {
  NearbyStoreResponseDto,
  NearbyStoresResponseDto,
} from './nearbyStoresResponseType';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNearbyStore(value: unknown): value is NearbyStoreResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.storeId) &&
    typeof value.name === 'string' &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null) &&
    typeof value.address === 'string' &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    isFiniteNumber(value.distance)
  );
}

function isNearbyStoresResponse(
  value: unknown,
): value is NearbyStoresResponseDto {
  if (!isRecord(value) || !isRecord(value.center)) {
    return false;
  }

  return (
    isFiniteNumber(value.center.latitude) &&
    isFiniteNumber(value.center.longitude) &&
    isFiniteNumber(value.radius) &&
    Array.isArray(value.stores) &&
    value.stores.every(isNearbyStore)
  );
}

export function parseNearbyStoresResponse(
  value: unknown,
): NearbyStoresResponseDto {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isNearbyStoresResponse(value.data)) {
    throw new Error('주변 매장 응답 형식이 올바르지 않습니다.');
  }

  return value.data;
}
