import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

export interface ChatTradeStatusAction {
  label: '예약 확정' | '거래 완료';
  nextStatus: Extract<TradeStatus, 'IN_PROGRESS' | 'COMPLETED'>;
}

const OWNER_ACTION_BY_STATUS: Partial<
  Record<TradeStatus, ChatTradeStatusAction>
> = {
  AVAILABLE: { label: '예약 확정', nextStatus: 'IN_PROGRESS' },
  IN_PROGRESS: { label: '거래 완료', nextStatus: 'COMPLETED' },
};

export function getChatTradeStatusAction(
  status: TradeStatus,
  isTradeOwner: boolean,
): ChatTradeStatusAction | null {
  if (!isTradeOwner) {
    return null;
  }

  return OWNER_ACTION_BY_STATUS[status] ?? null;
}
