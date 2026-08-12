export interface ApiResponseDto<T> {
  code: string;
  message: string;
  data: T;
}

export interface StoreDetailDto {
  storeId: number;
  name: string;
  address: string;
  businessHours: string;
  thumbnailUrl: string | null;
  imageUrls: string[];
  phone: string | null;
  instagramId: string | null;
  paymentMethods: string[];
  facilities: string[];
  machineAmount: number | null;
  kujiAmount: number | null;
  coinPrice: number | null;
  gachaMinPrice: number | null;
  gachaMaxPrice: number | null;
  kujiMinPrice: number | null;
  kujiMaxPrice: number | null;
  selectGachaMinPrice: number | null;
  selectGachaMaxPrice: number | null;
  hasRandomBox: boolean;
  hasSelectGacha: boolean;
  updatedAt: string;
}
