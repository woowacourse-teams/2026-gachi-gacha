import {
  TRADE_STATUSES,
  type TradeStatus,
} from '@/domains/trade/tradeSummaryType';

export const TRADE_SORT_ORDERS = ['latest', 'oldest'] as const;
export const TRADE_QUICK_KEYWORDS = [
  '산리오',
  '치이카와',
  '포켓몬',
  '짱구',
  '디즈니',
] as const;

export type TradeSortOrder = (typeof TRADE_SORT_ORDERS)[number];
export type TradeQuickKeyword = (typeof TRADE_QUICK_KEYWORDS)[number];

export interface TradeListFilter {
  keyword: string;
  status: TradeStatus | null;
  sortOrder: TradeSortOrder;
}

export function parseTradeQuickKeyword(
  value: string | null,
): TradeQuickKeyword | null {
  return TRADE_QUICK_KEYWORDS.includes(value as TradeQuickKeyword)
    ? (value as TradeQuickKeyword)
    : null;
}

export function parseTradeStatus(value: string | null): TradeStatus | null {
  return TRADE_STATUSES.includes(value as TradeStatus)
    ? (value as TradeStatus)
    : null;
}

export function parseTradeSortOrder(value: string | null): TradeSortOrder {
  return value === 'oldest' ? 'oldest' : 'latest';
}

export function getTradeSortParameter(sortOrder: TradeSortOrder): string {
  return sortOrder === 'oldest' ? 'createdAt,asc' : 'createdAt,desc';
}
