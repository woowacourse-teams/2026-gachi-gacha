import type { GachaProductSummary } from '../gachaProductType';

export const gachaProductsMock = [
  {
    gachaId: 10,
    name: '산리오 캐릭터즈 스탠드 피규어',
    thumbnailUrl: null,
    categories: ['산리오', '피규어'],
  },
  {
    gachaId: 11,
    name: '쿠로미 미니 피규어 vol.2',
    thumbnailUrl: null,
    categories: ['산리오', '쿠로미', '피규어'],
  },
  {
    gachaId: 12,
    name: '시나모롤 마스코트 키링',
    thumbnailUrl: null,
    categories: ['산리오', '시나모롤', '키링'],
  },
] satisfies readonly GachaProductSummary[];
