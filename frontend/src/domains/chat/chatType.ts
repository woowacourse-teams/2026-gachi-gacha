import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

export type ChatTradeAction =
  'CONFIRM_RESERVATION' | 'CANCEL_RESERVATION' | 'COMPLETE_TRADE';

export interface ChatTradeSummary {
  tradeId: number;
  title: string;
  status: TradeStatus;
  thumbnailUrl: string | null;
  /** 서버가 현재 사용자와 채팅방을 기준으로 허용한 액션 */
  availableAction: ChatTradeAction | null;
}

export interface ChatMemberSummary {
  memberId: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface ChatLastMessage {
  preview: string;
  sentAt: string;
}

export interface ChatRoomSummary {
  roomId: number;
  trade: ChatTradeSummary;
  otherMember: ChatMemberSummary;
  lastMessage: ChatLastMessage | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatRoomUpdate {
  room: ChatRoomSummary;
  totalUnreadCount: number;
}

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'ENTER' | 'LEAVE';

export interface ChatMessage {
  messageId: string;
  sequence: number;
  roomId: number;
  senderId: number;
  type: ChatMessageType;
  content: string;
  createdAt: string;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  nextLastSequence: number | null;
  hasNext: boolean;
}
