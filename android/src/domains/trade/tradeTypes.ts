export const TRADE_STATUSES = ['AVAILABLE', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export interface TradePlaceSummary {
  name: string | null;
  address: string;
}

export interface TradeSummary {
  tradeId: number;
  memberId: number;
  title: string;
  status: TradeStatus;
  categories: string[];
  thumbnailUrl: string | null;
  tradePlace: TradePlaceSummary | null;
  createdAt: string;
}

export interface TradeSummaryPage {
  content: TradeSummary[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface TradePlace extends TradePlaceSummary {
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
