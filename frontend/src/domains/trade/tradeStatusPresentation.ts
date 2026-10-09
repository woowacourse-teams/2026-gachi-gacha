import type { TradeStatus } from './tradeSummaryType';

interface TradeStatusPresentation {
  label: string;
  background: string;
  border: string;
  text: string;
}

export const TRADE_STATUS_PRESENTATIONS: Record<
  TradeStatus,
  TradeStatusPresentation
> = {
  AVAILABLE: {
    label: '교환 가능',
    background: '#fff0f4',
    border: '#ffc8d6',
    text: '#c51645',
  },
  IN_PROGRESS: {
    label: '교환 진행 중',
    background: '#fff7df',
    border: '#f2dc91',
    text: '#8a6400',
  },
  COMPLETED: {
    label: '교환 완료',
    background: '#f2f2f4',
    border: '#dedee3',
    text: '#62636b',
  },
};

export function getTradeStatusPresentation(
  status: TradeStatus,
): TradeStatusPresentation {
  return TRADE_STATUS_PRESENTATIONS[status];
}
