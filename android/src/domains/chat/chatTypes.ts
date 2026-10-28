import type { TradeStatus } from '../trade/tradeTypes';

export interface ChatTradeSummary {
  tradeId: number;
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

export interface ChatRoomUpdate {
  room: ChatRoomSummary;
  totalUnreadCount: number;
}

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'ENTER' | 'LEAVE';

export interface ChatMessageFile {
  url: string;
  originalName: string;
  contentType: string | null;
  size: number;
}

export interface ChatMessage {
  messageId: string;
  sequence: number;
  roomId: number;
  senderId: number;
  type: ChatMessageType;
  content: string | null;
  files: ChatMessageFile[];
  createdAt: string;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  nextLastSequence: number | null;
  hasNext: boolean;
}

export interface ChatImageUpload {
  uri: string;
  fileName: string;
  mimeType: string;
}
