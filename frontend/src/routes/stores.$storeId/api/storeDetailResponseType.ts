export interface StoreImageResponseDto {
  storeImageId: number;
  imageUrl: string;
}

export interface StoreDetailResponseDto {
  storeId: number;
  name: string;
  address: string;
  businessHours: string | null;
  thumbnailUrl: string | null;
  images: readonly StoreImageResponseDto[];
  phoneNumber: string | null;
  instagramId: string | null;
  paymentMethods: string | null;
  facilities: readonly string[];
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
