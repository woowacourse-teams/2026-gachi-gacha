export interface NearbyStoreResponseDto {
  storeId: number;
  name: string;
  thumbnailUrl: string | null;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface NearbyStoresResponseDto {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  stores: readonly NearbyStoreResponseDto[];
}
