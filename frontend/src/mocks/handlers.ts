import { http, HttpResponse } from 'msw';

import { mockStoreDetail } from '../features/storeDetail/mocks/storeDetail.mock';

export type MockStore = {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
};

export const mockStores: MockStore[] = [
  {
    id: 1,
    name: '가치가챠 테스트 매장',
    latitude: 37.5665,
    longitude: 126.978,
  },
];

export const handlers = [
  http.get('/api/stores', () => HttpResponse.json(mockStores)),
  http.get('/api/v1/stores/:storeId', ({ params }) => {
    const storeId = Number(params.storeId);

    if (storeId !== mockStoreDetail.storeId) {
      return HttpResponse.json(
        {
          code: 'STORE_NOT_FOUND',
          message: '매장을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: '요청이 성공했습니다.',
      data: mockStoreDetail,
    });
  }),
];
