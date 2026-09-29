import type { SecondhandItem } from '../model/secondhandItem';

export const SECONDHAND_ITEMS: SecondhandItem[] = [
  {
    tradeId: 1,
    memberId: 3,
    title: '산리오 캐릭터즈 캡슐토이 세트',
    status: 'AVAILABLE',
    categories: ['산리오', '피규어'],
    thumbnailUrl: null,
    tradePlace: { name: '신당역', address: '서울 중구 신당동' },
    createdAt: '2026-09-28T14:30:00',
  },
  {
    tradeId: 2,
    memberId: 4,
    title: '포켓몬 피규어 컬렉션 교환해요',
    status: 'IN_PROGRESS',
    categories: ['포켓몬', '피규어'],
    thumbnailUrl: null,
    tradePlace: { name: null, address: '서울 중구 황학동' },
    createdAt: '2026-09-27T11:20:00',
  },
  {
    tradeId: 3,
    memberId: 5,
    title: '치이카와 미니 키링 3종',
    status: 'AVAILABLE',
    categories: ['치이카와', '키링'],
    thumbnailUrl: null,
    tradePlace: null,
    createdAt: '2026-09-26T09:10:00',
  },
  {
    tradeId: 4,
    memberId: 6,
    title: '가챠 머신 미니어처',
    status: 'COMPLETED',
    categories: ['미니어처'],
    thumbnailUrl: null,
    tradePlace: { name: '청구역', address: '서울 중구 청구동' },
    createdAt: '2026-09-25T18:00:00',
  },
];
