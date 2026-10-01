export type ChatTradeStatus = '교환 가능' | '교환 진행 중' | '교환 완료';

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
}

export interface ChatRoom {
  conversationId: number;
  tradeId: number;
  partnerName: string;
  partnerProfileImageUrl: string | null;
  itemTitle: string;
  itemImageUrl: string | null;
  tradeStatus: ChatTradeStatus;
  messages: ChatMessage[];
}
