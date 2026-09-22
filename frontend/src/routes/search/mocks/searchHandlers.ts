import { http, HttpResponse } from 'msw';

import { createGachaProductMockResponse } from './gachaProductsMock';
import { createNearbyStoresMockResponse } from './nearbyStoresMock';

function parseGachaId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const gachaId = Number(value);

  return Number.isSafeInteger(gachaId) ? gachaId : null;
}

export const searchHandlers = [
  http.get('/api/v1/gachas/:gachaId', ({ params }) => {
    const gachaId = parseGachaId(params.gachaId);

    if (gachaId === null) {
      return HttpResponse.json(
        { code: 'CE001', message: '유효하지 않은 입력값입니다.' },
        { status: 400 },
      );
    }

    const response = createGachaProductMockResponse(gachaId);

    if (!response) {
      return HttpResponse.json(
        { code: 'GE001', message: '존재하지 않는 가챠입니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),
  http.get('/api/v1/stores/nearby/:gachaId', ({ params }) => {
    const gachaId = parseGachaId(params.gachaId);

    if (gachaId === null) {
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
