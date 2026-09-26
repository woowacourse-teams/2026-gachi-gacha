export const TRADE_STATUSES = [
  'AVAILABLE',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export type TradeStatus = (typeof TRADE_STATUSES)[number];

export interface TradeSummary {
  tradeId: number;
  memberId: number;
  title: string;
  status: TradeStatus;
  categories: string[];
  thumbnailUrl: string | null;
  tradePlace: string | null;
  createdAt: string;
}

export interface TradeSummaryPage {
  content: TradeSummary[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}
