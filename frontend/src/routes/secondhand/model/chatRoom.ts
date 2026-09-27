export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  sentAt: string;
}

export interface ChatRoom {
  partner: {
    nickname: string;
    isOnline: boolean;
    completedTradeCount: number;
  };
  product: {
    title: string;
    imageUrl?: string;
  };
  messages: ChatMessage[];
}
