import { http, HttpResponse } from 'msw';

import {
  DEFAULT_RADIUS,
  SUCCESS_CODE,
  type ApiResponse,
  type NearbyStore,
  type NearbyStoresData,
} from '@/apis/store';
import defaultStoreThumbnail from '@/assets/defaultStoreThumbnail.png';
import type { StoreDetailDto } from '@/features/storeDetail/api/storeDetail.dto';
import type { StoreGachaPageDto } from '@/features/storeDetail/api/storeGacha.dto';
import { mockStoreDetail } from '@/features/storeDetail/mocks/storeDetail.mock';

export const mockNearbyStores: NearbyStore[] = [
  {
    storeId: 2,
    thumbnailUrl: '',
    latitude: 37.5559645111431,
    longitude: 126.923901713362,
    distance: 145,
  },
  {
    storeId: 1,
    thumbnailUrl: '',
    latitude: 37.556674962258,
    longitude: 126.925336052306,
    distance: 180,
  },
  {
    storeId: 3,
    thumbnailUrl: '',
    latitude: 37.5569164654944,
    longitude: 126.925392965,
    distance: 207,
  },
];

const mockStoreDetails: Record<number, StoreDetailDto> = {
  1: mockStoreDetail,
  2: {
    ...mockStoreDetail,
    storeId: 2,
    name: '가챠스테이션 홍대입구점',
    address: '서울 마포구 양화로 160',
  },
  3: {
    ...mockStoreDetail,
    storeId: 3,
    name: '가챠스테이션 연남점',
    address: '서울 마포구 동교로 242',
  },
};

export const handlers = [
  http.get('/api/v1/stores/nearby', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const latitude = Number(params.get('latitude'));
    const longitude = Number(params.get('longitude'));
    const radius = Number(params.get('radius') ?? DEFAULT_RADIUS);

    return HttpResponse.json<ApiResponse<NearbyStoresData>>({
      code: SUCCESS_CODE,
      message: '요청에 성공했습니다.',
      data: {
        center: { latitude, longitude },
        radius,
        stores: mockNearbyStores.filter((store) => store.distance <= radius),
      },
    });
  }),
  http.get('/api/v1/stores/:storeId', ({ params }) => {
    const storeId = Number(params.storeId);
    const storeDetail = mockStoreDetails[storeId];

    if (!storeDetail) {
      return HttpResponse.json(
        {
          code: 'STORE_NOT_FOUND',
          message: '매장을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    return HttpResponse.json<ApiResponse<StoreDetailDto>>({
      code: SUCCESS_CODE,
      message: '요청이 성공했습니다.',
      data: storeDetail,
    });
  }),
  http.get('/api/v1/stores/:storeId/gachas', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const page = Number(params.get('page') ?? 0);
    const size = Number(params.get('size') ?? 20);

    return HttpResponse.json<ApiResponse<StoreGachaPageDto>>({
      code: SUCCESS_CODE,
      message: '요청이 성공했습니다.',
      data: {
        content:
          page === 0
            ? Array.from({ length: 8 }, (_, index) => ({
                gachaId: index + 1,
                thumbnailUrl: `${defaultStoreThumbnail}?gacha=${index + 1}`,
              }))
            : [],
        number: page,
        totalPages: size > 0 ? 1 : 0,
      },
    });
  }),
];
