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

export type StoreImage = {
  storeImageId: number;
  imageUrl: string;
};

export type StoreDetail = {
  storeId: number;
  name: string;
  address: string;
  businessHours: string | null;
  thumbnailUrl: string | null;
  images: StoreImage[];
  phoneNumber: string | null;
  instagramId: string | null;
  paymentMethods: string | null;
  facilities: string[];
  gachaMachineAmount: number | null;
  kujiAmount: number | null;
  coinPrice: number | null;
  gachaPriceMin: number | null;
  gachaPriceMax: number | null;
  kujiPriceMin: number | null;
  kujiPriceMax: number | null;
  selectGachaPriceMin: number | null;
  selectGachaPriceMax: number | null;
  hasRandomBox: boolean;
  hasSelectGacha: boolean | null;
  updatedAt: string;
};

export type StoreGacha = {
  gachaId: number;
  gachaName: string;
  thumbnailUrl: string | null;
};

export type StoreGachaPage = {
  content: StoreGacha[];
  pageNumber: number;
  totalElements: number;
  totalPages: number;
};
