import { http, HttpResponse } from 'msw';

import { createStoreDetailMockResponse } from './storeDetailMock';

function parseStoreId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const storeId = Number(value);

  return Number.isSafeInteger(storeId) ? storeId : null;
}

export const storeDetailHandlers = [
  http.get('/api/v1/stores/:storeId', ({ params }) => {
    const storeId = parseStoreId(params.storeId);

    if (storeId === null) {
      return HttpResponse.json(
        { code: 'CE001', message: '유효하지 않은 입력값입니다.' },
        { status: 400 },
      );
    }

    const response = createStoreDetailMockResponse(storeId);

    if (!response) {
      return HttpResponse.json(
        { code: 'SE001', message: '존재하지 않는 매장입니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),
];
