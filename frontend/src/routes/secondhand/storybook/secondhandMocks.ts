import type { SecondhandDetail } from '../model/secondhandDetail';
import type { SecondhandItem } from '../model/secondhandItem';

function createMockImage(symbol: string, background: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" rx="36" fill="${background}" />
      <circle cx="300" cy="300" r="174" fill="#ffffff" fill-opacity="0.58" />
      <text x="300" y="340" text-anchor="middle" font-size="164">${symbol}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const SECONDHAND_ITEMS: SecondhandItem[] = [
  {
    id: 1,
    title: '산리오 캐릭터즈 캡슐토이 세트',
    price: 16000,
    neighborhood: '신당동',
    postedAt: '20시간 전',
    imageUrl: createMockImage('🎀', '#fff0f3'),
  },
  {
    id: 2,
    title: '포켓몬 피규어 컬렉션 일괄',
    price: 12000,
    neighborhood: '황학동',
    postedAt: '1일 전',
    imageUrl: createMockImage('⚡', '#fff7dc'),
  },
  {
    id: 3,
    title: '치이카와 미니 키링 3종',
    price: 8000,
    neighborhood: '신당동',
    postedAt: '2일 전',
    imageUrl: createMockImage('🐰', '#eef7ff'),
    badge: '미개봉',
  },
  {
    id: 4,
    title: '가챠 머신 미니어처',
    price: 22000,
    neighborhood: '신당동',
    postedAt: '3일 전',
    imageUrl: createMockImage('🍭', '#f4edff'),
  },
  {
    id: 5,
    title: '디즈니 캡슐토이 미개봉',
    price: 7000,
    neighborhood: '동화동',
    postedAt: '4일 전',
    imageUrl: createMockImage('🏰', '#eaf8f4'),
  },
  {
    id: 6,
    title: '짱구 피규어 세트',
    price: 15000,
    neighborhood: '약수동',
    postedAt: '5일 전',
    imageUrl: createMockImage('👶', '#fff2df'),
  },
  {
    id: 7,
    title: '쿠로미 키링 나눔합니다',
    price: null,
    neighborhood: '청구동',
    postedAt: '6일 전',
    imageUrl: createMockImage('💜', '#f3efff'),
    badge: '나눔',
  },
  {
    id: 8,
    title: '미니어처 소품 묶음',
    price: 5000,
    neighborhood: '신당동',
    postedAt: '1주 전',
    imageUrl: createMockImage('🧸', '#edf3ff'),
  },
];

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
