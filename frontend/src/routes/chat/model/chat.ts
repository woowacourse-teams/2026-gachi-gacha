import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

export type ChatTradeStatus = TradeStatus;
export type ChatTradeAction =
  'confirm_reservation' | 'cancel_reservation' | 'complete_trade';

export interface ChatConversation {
  id: number;
  partnerName: string;
  partnerProfileImageUrl: string | null;
  itemTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: ChatTradeStatus;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  sentAt: string;
  /** 날짜 구분선용 날짜 키(YYYY-MM-DD). 시각을 알 수 없으면 빈 문자열 */
  sentDate: string;
}

export interface ChatRoom {
  conversationId: number;
  tradeId: number;
  partnerName: string;
  partnerProfileImageUrl: string | null;
  itemTitle: string;
  itemImageUrl: string | null;
  tradeStatus: ChatTradeStatus;
  tradeAction: ChatTradeAction | null;
  messages: ChatMessage[];
}
