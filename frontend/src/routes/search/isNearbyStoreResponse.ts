import type { NearbyStoreResponseDto } from './nearbyStoresResponseType';

export function isNearbyStoreResponse(
  value: unknown,
): value is NearbyStoreResponseDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const store = value as Record<string, unknown>;

  return (
    typeof store.storeId === 'number' &&
    typeof store.name === 'string' &&
    (typeof store.thumbnailUrl === 'string' || store.thumbnailUrl === null) &&
    typeof store.address === 'string' &&
    typeof store.latitude === 'number' &&
    typeof store.longitude === 'number' &&
    typeof store.distance === 'number'
  );
}
