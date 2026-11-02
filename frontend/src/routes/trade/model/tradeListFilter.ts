import {
  TRADE_STATUSES,
  type TradeStatus,
} from '@/domains/trade/tradeSummaryType';

export const TRADE_SORT_ORDERS = ['latest', 'oldest'] as const;

export type TradeSortOrder = (typeof TRADE_SORT_ORDERS)[number];

export interface TradeListFilter {
  keyword: string;
  categoryId: number | null;
  status: TradeStatus | null;
  sortOrder: TradeSortOrder;
}

export function parseTradeCategoryId(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const categoryId = Number(value);

  return Number.isSafeInteger(categoryId) && categoryId > 0 ? categoryId : null;
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
