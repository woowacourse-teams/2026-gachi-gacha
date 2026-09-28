export type ChatTradeStatus = '답장 대기' | '진행 중' | '교환 완료';

export interface ChatConversation {
  id: number;
  partnerName: string;
  itemTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: ChatTradeStatus;
}

export interface ChatMessage {
  id: number;
  sender: 'me' | 'other';
  text: string;
  sentAt: string;
}

export interface ChatRoom {
  conversationId: number;
  partnerName: string;
  partnerNeighborhood: string;
  itemTitle: string;
  tradeStatus: ChatTradeStatus;
  messages: ChatMessage[];
}
