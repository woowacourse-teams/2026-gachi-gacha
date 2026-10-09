import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

export interface ChatTradeSummary {
  tradeId: number;
  /** 서버 계약 전환 중 누락될 수 있으므로, 없으면 예약 액션을 노출하지 않는다. */
  memberId: number | null;
  title: string;
  status: TradeStatus;
  thumbnailUrl: string | null;
  /** 이 채팅방이 해당 교환글에 예약된 유일한 방인지 여부 */
  isReservedRoom: boolean;
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
