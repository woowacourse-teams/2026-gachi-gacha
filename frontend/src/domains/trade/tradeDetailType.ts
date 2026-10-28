import type { TradeStatus } from './tradeSummaryType';

export interface TradePlace {
  name: string | null;
  address: string;
  latitude: number;
  longitude: number;
}

export interface TradeDetail {
  tradeId: number;
  memberId: number;
  title: string;
  description: string | null;
  desiredProduction: string | null;
  categories: string[];
  status: TradeStatus;
  purchaseStore: TradePlace | null;
  tradePlace: TradePlace | null;
  availableTime: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}
