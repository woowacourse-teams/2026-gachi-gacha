import { http, HttpResponse } from 'msw';

import { createStoreDetailMockResponse } from './storeDetailMock';
import { createStoreGachaMockResponse } from './storeGachaMock';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 8;

function parseStoreId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const storeId = Number(value);

  return Number.isSafeInteger(storeId) ? storeId : null;
}

function parseUnsignedInteger(
  value: string | null,
  fallback: number,
): number | null {
  const queryValue = value ?? String(fallback);

  if (!/^\d+$/.test(queryValue)) {
    return null;
  }

  const parsedValue = Number(queryValue);

  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

export const storeDetailHandlers = [
  http.get('/api/v1/stores/:storeId/gachas', ({ params, request }) => {
    const storeId = parseStoreId(params.storeId);
    const searchParams = new URL(request.url).searchParams;
    const page = parseUnsignedInteger(searchParams.get('page'), DEFAULT_PAGE);
    const size = parseUnsignedInteger(
      searchParams.get('size'),
      DEFAULT_PAGE_SIZE,
    );

    if (storeId === null || page === null || size === null || size === 0) {
      return HttpResponse.json(
        { code: 'CE001', message: '유효하지 않은 입력값입니다.' },
        { status: 400 },
      );
    }

    const response = createStoreGachaMockResponse(storeId, page, size);

    if (!response) {
      return HttpResponse.json(
        { code: 'SE001', message: '존재하지 않는 매장입니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),
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
