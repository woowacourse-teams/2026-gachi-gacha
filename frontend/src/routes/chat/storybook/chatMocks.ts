import type { ChatConversation, ChatRoom } from '../model/chat';
import { toChatDateKey } from '../model/chatDate';

// 스토리에서 날짜 구분선이 보이도록 오늘과 어제 날짜를 섞어 둡니다.
const TODAY = toChatDateKey(new Date().toISOString());
const YESTERDAY = toChatDateKey(
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
);

export const CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 1,
    partnerName: '가챠좋아',
    partnerProfileImageUrl: null,
    itemTitle: '쿠로미 미니 피규어 vol.2',
    lastMessage: '시나모롤 키링 사진 확인 부탁드려요.',
    lastMessageAt: '오전 9:20',
    unreadCount: 2,
    status: 'AVAILABLE',
  },
  {
    id: 2,
    partnerName: '피규어수집가',
    partnerProfileImageUrl: null,
    itemTitle: '마이멜로디 미니피규어',
    lastMessage: '내일 합정역에서 뵐게요!',
    lastMessageAt: '어제',
    unreadCount: 0,
    status: 'IN_PROGRESS',
  },
  {
    id: 3,
    partnerName: '캡슐러버',
    partnerProfileImageUrl: null,
    itemTitle: '치이카와 키링 교환',
    lastMessage: '좋은 교환 감사합니다.',
    lastMessageAt: '9월 21일',
    unreadCount: 0,
    status: 'COMPLETED',
  },
];

export const SELECTED_CHAT_ROOM: ChatRoom = {
  conversationId: 1,
  tradeId: 1,
  partnerName: '가챠좋아',
  partnerProfileImageUrl: null,
  itemTitle: '쿠로미 미니 피규어 vol.2',
  itemImageUrl: null,
  tradeStatus: 'AVAILABLE',
  tradeAction: 'confirm_reservation',
  messages: [
    {
      id: '1',
      sender: 'other',
      text: '안녕하세요! 올리신 쿠로미 피규어 아직 교환 가능할까요?',
      sentAt: '오전 9:12',
      sentDate: YESTERDAY,
    },
    {
      id: '2',
      sender: 'me',
      text: '네, 아직 가능해요. 어떤 가챠와 교환 원하시나요?',
      sentAt: '오전 9:15',
      sentDate: TODAY,
    },
    {
      id: '3',
      sender: 'other',
      text: '시나모롤 키링이 있어요. 사진 확인 부탁드려요.',
      sentAt: '오전 9:20',
      sentDate: TODAY,
    },
  ],
};
