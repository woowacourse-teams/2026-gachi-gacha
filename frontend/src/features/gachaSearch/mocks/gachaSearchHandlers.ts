import { http, HttpResponse } from 'msw';

import { createGachaSearchMockResponse } from './gachaSearchMock';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;

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

export const gachaSearchHandlers = [
  http.get('/api/v1/gachas', ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const keyword = searchParams.get('keyword') ?? '';
    const page = parseUnsignedInteger(searchParams.get('page'), DEFAULT_PAGE);
    const size = parseUnsignedInteger(
      searchParams.get('size'),
      DEFAULT_PAGE_SIZE,
    );

    if (page === null || size === null || size === 0) {
      return HttpResponse.json(
        { code: 'CE001', message: '유효하지 않은 입력값입니다.' },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      createGachaSearchMockResponse({ keyword, page, size }),
    );
  }),
];
