import type { NearbyStoreSearchParams } from './nearbyStoreSearchParamsType';

const NEARBY_STORES_API_PATH = '/api/v1/stores/nearby';

export function createNearbyStoreSearchUrl({
  latitude,
  longitude,
  radius,
  keyword,
  categoryIds,
}: NearbyStoreSearchParams): string {
  const searchParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });

  if (keyword?.trim()) {
    searchParams.set('keyword', keyword.trim());
  }

  if (categoryIds?.length) {
    searchParams.set('categoryIds', categoryIds.join(','));
  }

  return `${NEARBY_STORES_API_PATH}?${searchParams}`;
}
