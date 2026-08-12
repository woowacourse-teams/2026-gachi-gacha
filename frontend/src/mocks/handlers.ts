import { http, HttpResponse } from 'msw';

import {
  DEFAULT_RADIUS,
  type ApiResponse,
  type NearbyStore,
  type NearbyStoresData,
} from '@/apis/store';

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

export const handlers = [
  http.get('/api/v1/stores/nearby', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const latitude = Number(params.get('latitude'));
    const longitude = Number(params.get('longitude'));
    const radius = Number(params.get('radius') ?? DEFAULT_RADIUS);

    return HttpResponse.json<ApiResponse<NearbyStoresData>>({
      code: 'SUCCESS',
      message: '요청에 성공했습니다.',
      data: {
        center: { latitude, longitude },
        radius,
        stores: mockNearbyStores.filter((store) => store.distance <= radius),
      },
    });
  }),
];
