import type { NearbyStoreSearchParams } from './nearbyStoreSearchParamsType';

const NEARBY_STORES_API_PATH = '/api/v1/stores/nearby';

export function createNearbyStoreSearchUrl({
  gachaId,
  latitude,
  longitude,
  radius,
}: NearbyStoreSearchParams): string {
  const searchParams = new URLSearchParams({
    gachaId: String(gachaId),
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });

  return `${NEARBY_STORES_API_PATH}?${searchParams}`;
}
