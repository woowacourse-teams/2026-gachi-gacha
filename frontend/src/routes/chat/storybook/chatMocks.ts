import type { ChatConversation, ChatRoom } from '../model/chat';

export const CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 1,
    partnerName: '가챠좋아',
    itemTitle: '쿠로미 미니 피규어 vol.2',
    lastMessage: '시나모롤 키링 사진 확인 부탁드려요.',
    lastMessageAt: '오전 9:20',
    unreadCount: 2,
    status: '답장 대기',
  },
  {
    id: 2,
    partnerName: '피규어수집가',
    itemTitle: '마이멜로디 미니피규어',
    lastMessage: '내일 합정역에서 뵐게요!',
    lastMessageAt: '어제',
    unreadCount: 0,
    status: '진행 중',
  },
  {
    id: 3,
    partnerName: '캡슐러버',
    itemTitle: '치이카와 키링 교환',
    lastMessage: '좋은 교환 감사합니다.',
    lastMessageAt: '9월 21일',
    unreadCount: 0,
    status: '교환 완료',
  },
];

export const SELECTED_CHAT_ROOM: ChatRoom = {
  conversationId: 1,
  partnerName: '가챠좋아',
  partnerNeighborhood: '신당동 · 교환 8회',
  itemTitle: '쿠로미 미니 피규어 vol.2',
  tradeStatus: '답장 대기',
  messages: [
    {
      id: 1,
      sender: 'other',
      text: '안녕하세요! 올리신 쿠로미 피규어 아직 교환 가능할까요?',
      sentAt: '오전 9:12',
    },
    {
      id: 2,
      sender: 'me',
      text: '네, 아직 가능해요. 어떤 가챠와 교환 원하시나요?',
      sentAt: '오전 9:15',
    },
    {
      id: 3,
      sender: 'other',
      text: '시나모롤 키링이 있어요. 사진 확인 부탁드려요.',
      sentAt: '오전 9:20',
    },
  ],
};
