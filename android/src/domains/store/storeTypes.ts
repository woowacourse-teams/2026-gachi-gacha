export type NearbyStore = {
  storeId: number;
  name: string;
  thumbnailUrl: string | null;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  gachaCount?: number;
};

export type NearbyStoreResult = {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  stores: NearbyStore[];
};
