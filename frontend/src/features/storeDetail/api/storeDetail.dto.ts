export interface ApiResponseDto<T> {
  code: string;
  message: string;
  data: T;
}

export interface StoreImageDto {
  storeImageId: number;
  imageUrl: string;
}

export interface StoreDetailDto {
  storeId: number;
  name: string;
  address: string;
  businessHours: string | null;
  thumbnailUrl: string | null;
  images: StoreImageDto[];
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
}
