export interface NearbyStoreSearchParams {
  latitude: number;
  longitude: number;
  radius: number;
  keyword?: string;
  categoryIds?: readonly number[];
}
