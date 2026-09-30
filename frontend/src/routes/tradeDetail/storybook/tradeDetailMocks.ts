import type { TradeDetail } from '@/domains/trade/tradeDetailType';

export const TRADE_DETAIL: TradeDetail = {
  tradeId: 101,
  memberId: 7,
  title: '쿠로미 미니 피규어 vol.2 교환해요',
  categories: ['피규어', '산리오'],
  status: 'AVAILABLE',
  desiredProduction: '시나모롤 키링 또는 산리오 랜덤 피규어',
  purchaseStore: {
    name: '가챠샵 홍대점',
    address: '서울특별시 마포구 양화로 100',
    latitude: 37.5563,
    longitude: 126.9236,
  },
  tradePlace: {
    name: '홍대입구역 8번 출구',
    address: '서울특별시 마포구 양화로 160',
    latitude: 37.557,
    longitude: 126.9245,
  },
  availableTime: '2026-09-30T19:30:00',
  description:
    '캡슐 개봉만 했고 전시하지 않은 상태입니다. 도색 미스나 눈에 띄는 하자는 없어요. 홍대입구역 근처에서 직거래를 원하며, 교환 제안 전에 가챠 상태를 확인할 수 있는 사진을 부탁드려요.',
  imageUrls: [],
  createdAt: '2026-09-29T14:30:00',
  updatedAt: '2026-09-29T14:30:00',
};
