import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

export interface ChatTradeSummary {
  tradeId: number;
  memberId: number;
  title: string;
  status: TradeStatus;
  thumbnailUrl: string | null;
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
