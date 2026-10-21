import { getApiBaseUrl } from '../../config/api';
import type { NearbyStore, NearbyStoreResult } from './storeTypes';

const DEFAULT_ERROR_MESSAGE = '주변 매장을 불러오지 못했습니다.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNearbyStore(value: unknown): value is NearbyStore {
  return (
    isRecord(value) &&
    isFiniteNumber(value.storeId) &&
    Number.isSafeInteger(value.storeId) &&
    value.storeId > 0 &&
    typeof value.name === 'string' &&
    (value.thumbnailUrl === null || typeof value.thumbnailUrl === 'string') &&
    typeof value.address === 'string' &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    isFiniteNumber(value.distance) &&
    (value.gachaCount === undefined ||
      (isFiniteNumber(value.gachaCount) &&
        Number.isSafeInteger(value.gachaCount) &&
        value.gachaCount >= 0))
  );
}

function parseNearbyStores(value: unknown): NearbyStoreResult {
  if (!isRecord(value) || value.code !== 'C000') {
    throw new Error(
      isRecord(value) && typeof value.message === 'string'
        ? value.message
        : DEFAULT_ERROR_MESSAGE,
    );
  }

  const data = value.data;
  if (
    !isRecord(data) ||
    !isRecord(data.center) ||
    !isFiniteNumber(data.center.latitude) ||
    !isFiniteNumber(data.center.longitude) ||
    !isFiniteNumber(data.radius) ||
    !Array.isArray(data.stores) ||
    !data.stores.every(isNearbyStore)
  ) {
    throw new Error('주변 매장 응답 형식이 올바르지 않습니다.');
  }

  return {
    center: {
      latitude: data.center.latitude,
      longitude: data.center.longitude,
    },
    radius: data.radius,
    stores: data.stores,
  };
}

export async function getNearbyStores({
  latitude,
  longitude,
  radius,
  gachaId,
  signal,
}: {
  latitude: number;
  longitude: number;
  radius: number;
  gachaId: number | null;
  signal?: AbortSignal;
}): Promise<NearbyStoreResult> {
  const apiBaseUrl = getApiBaseUrl();
  const endpoint = gachaId === null
    ? '/api/v1/stores/nearby'
    : `/api/v1/stores/nearby/${encodeURIComponent(gachaId)}`;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });
  const response = await fetch(`${apiBaseUrl}${endpoint}?${params}`, { signal });

  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : DEFAULT_ERROR_MESSAGE,
    );
  }

  return parseNearbyStores(body);
}
