import type { NearbyStoreSearchParams } from './nearbyStoreSearchParamsType';

const NEARBY_STORES_API_PATH = '/api/v1/stores/nearby';

export function createNearbyStoreSearchUrl({
  gachaId,
  latitude,
  longitude,
  radius,
}: NearbyStoreSearchParams): string {
  const searchParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });
  const endpoint = `${NEARBY_STORES_API_PATH}/${encodeURIComponent(gachaId)}`;

  return `${endpoint}?${searchParams}`;
}
