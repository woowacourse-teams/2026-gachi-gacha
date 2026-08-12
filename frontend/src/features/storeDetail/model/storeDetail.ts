export type BottomSheetState = 'closed' | 'collapsed' | 'summary' | 'full';

export interface StoreDetailPrice {
  label: string;
  value: string;
}

export interface StoreDetailSocialLink {
  platform: 'instagram' | 'kakao';
  url: string;
}

export interface StoreDetail {
  id: number;
  name: string;
  address: string;
  businessHours: string;
  imageUrls: string[];
  phone: string | null;
  socialLinks: StoreDetailSocialLink[];
  categories: string[];
  paymentMethods: string[];
  facilities: string[];
  machineAmount: string;
  kujiAmount: string;
  prices: StoreDetailPrice[];
  hasRandomBox: boolean;
  hasSelectGacha: boolean;
  updatedAt: string;
  distance: string | null;
}
