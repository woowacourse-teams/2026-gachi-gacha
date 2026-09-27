export interface SecondhandItem {
  id: number;
  title: string;
  price: number | null;
  neighborhood: string;
  postedAt: string;
  imageUrl?: string;
  visual: string;
  visualColor: string;
  badge?: string;
}

export const SECONDHAND_ITEMS: SecondhandItem[] = [
  {
    id: 1,
    title: '산리오 캐릭터즈 캡슐토이 세트',
    price: 16000,
    neighborhood: '신당동',
    postedAt: '20시간 전',
    visual: '🎀',
    visualColor: '#fff0f3',
  },
  {
    id: 2,
    title: '포켓몬 피규어 컬렉션 일괄',
    price: 12000,
    neighborhood: '황학동',
    postedAt: '1일 전',
    visual: '⚡',
    visualColor: '#fff7dc',
  },
  {
    id: 3,
    title: '치이카와 미니 키링 3종',
    price: 8000,
    neighborhood: '신당동',
    postedAt: '2일 전',
    visual: '🐰',
    visualColor: '#eef7ff',
    badge: '미개봉',
  },
  {
    id: 4,
    title: '가챠 머신 미니어처',
    price: 22000,
    neighborhood: '신당동',
    postedAt: '3일 전',
    visual: '🍭',
    visualColor: '#f4edff',
  },
  {
    id: 5,
    title: '디즈니 캡슐토이 미개봉',
    price: 7000,
    neighborhood: '동화동',
    postedAt: '4일 전',
    visual: '🏰',
    visualColor: '#eaf8f4',
  },
  {
    id: 6,
    title: '짱구 피규어 세트',
    price: 15000,
    neighborhood: '약수동',
    postedAt: '5일 전',
    visual: '👶',
    visualColor: '#fff2df',
  },
  {
    id: 7,
    title: '쿠로미 키링 나눔합니다',
    price: null,
    neighborhood: '청구동',
    postedAt: '6일 전',
    visual: '💜',
    visualColor: '#f3efff',
    badge: '나눔',
  },
  {
    id: 8,
    title: '미니어처 소품 묶음',
    price: 5000,
    neighborhood: '신당동',
    postedAt: '1주 전',
    visual: '🧸',
    visualColor: '#edf3ff',
  },
];
