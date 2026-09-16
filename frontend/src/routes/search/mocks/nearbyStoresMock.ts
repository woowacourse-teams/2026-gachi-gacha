import type { ApiResponse } from '@/shared/api/apiResponseType';

import type { NearbyStoresResponseDto } from '../api/nearbyStoresResponseType';

export const nearbyStoresMockResponse = {
  code: 'C000',
  message: '정상',
  data: {
    center: {
      latitude: 37.5563,
      longitude: 126.9236,
    },
    radius: 3000,
    stores: [
      {
        storeId: 1,
        name: '홍대 가챠 스테이션',
        thumbnailUrl: null,
        address: '서울 마포구 홍익로 1',
        latitude: 37.5559,
        longitude: 126.9238,
        distance: 120,
      },
      {
        storeId: 2,
        name: '연남 캡슐토이',
        thumbnailUrl: null,
        address: '서울 마포구 동교로 2',
        latitude: 37.5584,
        longitude: 126.9251,
        distance: 310,
      },
      {
        storeId: 3,
        name: '합정 가챠샵',
        thumbnailUrl: null,
        address: '서울 마포구 양화로 3',
        latitude: 37.5502,
        longitude: 126.9145,
        distance: 980,
      },
    ],
  },
} satisfies ApiResponse<NearbyStoresResponseDto>;
