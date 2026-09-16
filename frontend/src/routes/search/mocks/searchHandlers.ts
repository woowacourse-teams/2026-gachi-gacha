import { http, HttpResponse } from 'msw';

import { createNearbyStoresMockResponse } from './nearbyStoresMock';

export const searchHandlers = [
  http.get('/api/v1/stores/nearby', ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const gachaId = Number(searchParams.get('gachaId') ?? Number.NaN);

    if (!Number.isSafeInteger(gachaId) || gachaId <= 0) {
      return HttpResponse.json(
        { code: 'CE001', message: '유효하지 않은 입력값입니다.' },
        { status: 400 },
      );
    }

    const response = createNearbyStoresMockResponse(gachaId);

    if (!response) {
      return HttpResponse.json(
        { code: 'GE001', message: '존재하지 않는 가챠입니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),
];
