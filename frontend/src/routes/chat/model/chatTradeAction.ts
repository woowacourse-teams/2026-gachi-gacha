import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

import type { ChatTradeAction } from './chat';

interface ChatTradeActionContext {
  status: TradeStatus;
  isReservedRoom: boolean;
  isTradeOwner: boolean;
}

/**
 * 서버가 확정한 거래 상태와 예약 방 여부만으로 현재 사용자의 허용 액션을 계산한다.
 * 예약 방 식별 정보가 없는 이전 응답에서는 어떤 액션도 만들지 않는다.
 */
export function getChatTradeAction({
  status,
  isReservedRoom,
  isTradeOwner,
}: ChatTradeActionContext): ChatTradeAction | null {
  if (status === 'AVAILABLE') {
    return isTradeOwner ? 'confirm_reservation' : null;
  }

  if (status !== 'IN_PROGRESS' || !isReservedRoom) {
    return null;
  }

  return isTradeOwner ? 'cancel_reservation' : 'complete_trade';
}
