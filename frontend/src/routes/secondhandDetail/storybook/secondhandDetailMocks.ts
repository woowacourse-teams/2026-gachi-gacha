import { createMockImage } from '../../secondhand/storybook/secondhandMocks';
import type { ChatRoom } from '../model/chatRoom';
import type { SecondhandDetail } from '../model/secondhandDetail';

export const SECONDHAND_DETAIL: SecondhandDetail = {
  id: 101,
  imageUrls: [
    createMockImage('💜', '#eee8ff'),
    createMockImage('🎀', '#fff0f5'),
    createMockImage('🎁', '#f4edff'),
  ],
  title: '쿠로미 미니 피규어 vol.2 교환해요',
  category: '피규어',
  status: '개봉 후 미사용',
  postedAt: '20시간 전',
  viewCount: 128,
  wishCount: 12,
  wantedTrade: '시나모롤 키링 또는 산리오 랜덤 피규어',
  place: '홍대입구역 8번 출구',
  availableTime: '평일 19:30 이후',
  description:
    '캡슐 개봉만 했고 전시하지 않은 상태입니다. 도색 미스나 눈에 띄는 하자는 없어요. 홍대입구역 근처에서 직거래를 원하며, 교환 제안 전에 가챠 상태를 확인할 수 있는 사진을 부탁드려요.',
  seller: {
    nickname: '가챠좋아',
    neighborhood: '신당동',
    completedTradeCount: 8,
  },
};

export const SECONDHAND_CHAT_ROOM: ChatRoom = {
  partner: {
    nickname: '가챠좋아',
    isOnline: true,
    completedTradeCount: 8,
  },
  product: {
    title: SECONDHAND_DETAIL.title,
    imageUrl: SECONDHAND_DETAIL.imageUrls[0]!,
  },
  messages: [
    {
      id: 'message-1',
      sender: 'other',
      text: '안녕하세요! 올리신 쿠로미 피규어 아직 교환 가능할까요?',
      sentAt: '오후 7:18',
    },
    {
      id: 'message-2',
      sender: 'me',
      text: '네, 아직 가능해요! 어떤 가챠와 교환 원하시나요?',
      sentAt: '오후 7:20',
    },
    {
      id: 'message-3',
      sender: 'other',
      text: '시나모롤 키링이 있어요. 사진 보내드려도 될까요?',
      sentAt: '오후 7:21',
    },
  ],
};
