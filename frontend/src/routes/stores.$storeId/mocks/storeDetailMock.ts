import storeGoods from '@/demo/assets/store-goods.webp';
import storeInterior from '@/demo/assets/store-interior.webp';
import storeMachinesTwo from '@/demo/assets/store-machines-two.webp';
import storeMachines from '@/demo/assets/store-machines.webp';
import storeMowajul from '@/demo/assets/store-mowajul.webp';
import storeOcean from '@/demo/assets/store-ocean.webp';
import type { ApiResponse } from '@/shared/api/apiResponseType';

import type { StoreDetailResponseDto } from '../api/storeDetailResponseType';

const storeDetailMocks = [
  {
    storeId: 1,
    name: '홍대 가챠 스테이션',
    address: '서울 마포구 홍익로 1',
    businessHours: '월-목 11:00-21:00\n금-토 11:00-22:30\n일요일 12:00-20:00',
    thumbnailUrl: storeMachines,
    images: [
      { storeImageId: 1, imageUrl: storeMachines },
      { storeImageId: 2, imageUrl: storeMachinesTwo },
      { storeImageId: 3, imageUrl: storeGoods },
      { storeImageId: 4, imageUrl: storeInterior },
      { storeImageId: 5, imageUrl: storeMowajul },
      { storeImageId: 6, imageUrl: storeOcean },
    ],
    phoneNumber: '02-1234-5678',
    instagramId: '@gachigacha_hongdae',
    paymentMethods: '현금, 카드, 교통카드',
    facilities: [
      '주차 가능',
      '엘리베이터',
      '화장실',
      '휠체어 출입 가능',
      '휴게 공간',
      '에어컨',
      '캡슐 수거함',
      '굿즈 교환 공간',
    ],
    gachaMachineAmount: 128,
    kujiAmount: 18,
    coinPrice: 500,
    gachaPriceMin: 3000,
    gachaPriceMax: 6000,
    kujiPriceMin: 8000,
    kujiPriceMax: 12000,
    selectGachaPriceMin: 6000,
    selectGachaPriceMax: 10000,
    hasRandomBox: true,
    hasSelectGacha: true,
    updatedAt: '2026-09-23T12:00:00+09:00',
  },
  {
    storeId: 2,
    name: '연남 캡슐토이',
    address: '서울 마포구 동교로 2',
    businessHours: null,
    thumbnailUrl: null,
    images: [],
    phoneNumber: null,
    instagramId: null,
    paymentMethods: null,
    facilities: [],
    gachaMachineAmount: 64,
    kujiAmount: null,
    coinPrice: null,
    gachaPriceMin: 3000,
    gachaPriceMax: 5000,
    kujiPriceMin: null,
    kujiPriceMax: null,
    selectGachaPriceMin: null,
    selectGachaPriceMax: null,
    hasRandomBox: false,
    hasSelectGacha: null,
    updatedAt: '2026-09-22T18:30:00+09:00',
  },
] satisfies readonly StoreDetailResponseDto[];

export function createStoreDetailMockResponse(
  storeId: number,
): ApiResponse<StoreDetailResponseDto> | null {
  const storeDetail = storeDetailMocks.find(
    (candidate) => candidate.storeId === storeId,
  );

  if (!storeDetail) {
    return null;
  }

  return {
    code: 'C000',
    message: '정상',
    data: storeDetail,
  };
}
