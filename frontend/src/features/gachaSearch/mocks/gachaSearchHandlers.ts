import { http, HttpResponse } from 'msw';

import {
  createCategorySearchMockResponse,
  createGachaSearchMockResponse,
} from './gachaSearchMock';

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

function parseCategoryIds(searchParams: URLSearchParams): number[] | null {
  const values = searchParams
    .getAll('categoryIds')
    .flatMap((value) => value.split(','))
    .filter(Boolean);

  if (values.length === 0 || values.some((value) => !/^\d+$/.test(value))) {
    return null;
  }

  const categoryIds = values.map(Number);

  return categoryIds.every(
    (categoryId) => Number.isSafeInteger(categoryId) && categoryId > 0,
  )
    ? categoryIds
    : null;
}

export const gachaSearchHandlers = [
  http.get('/api/v1/categories', ({ request }) => {
    const keyword = new URL(request.url).searchParams.get('keyword') ?? '';

    return HttpResponse.json(createCategorySearchMockResponse(keyword));
  }),
  http.get('/api/v1/gachas', ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const categoryIds = parseCategoryIds(searchParams);
    const page = parseUnsignedInteger(searchParams.get('page'), DEFAULT_PAGE);
    const size = parseUnsignedInteger(
      searchParams.get('size'),
      DEFAULT_PAGE_SIZE,
    );

    if (categoryIds === null || page === null || size === null || size === 0) {
      return HttpResponse.json(
        { code: 'CE001', message: '유효하지 않은 입력값입니다.' },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      createGachaSearchMockResponse({ categoryIds, page, size }),
    );
  }),
];
