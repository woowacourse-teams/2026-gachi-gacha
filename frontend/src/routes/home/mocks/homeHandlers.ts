import { http, HttpResponse } from 'msw';

import { gachaProductsMock } from '@/domains/product/mocks/gachaProductsMock';

const CATEGORY_GACHAS_API_PATH = '/api/v1/gachas/category/:category';
const DEFAULT_PAGE_SIZE = 12;

export const homeHandlers = [
  http.get(CATEGORY_GACHAS_API_PATH, ({ params, request }) => {
    const category = String(params.category);
    const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
    const categoryGachas = gachaProductsMock.filter((gacha) =>
      gacha.categories.includes(category),
    );
    const pageStart = page * DEFAULT_PAGE_SIZE;
    const content = categoryGachas.slice(
      pageStart,
      pageStart + DEFAULT_PAGE_SIZE,
    );

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        content,
        number: page,
        last: pageStart + DEFAULT_PAGE_SIZE >= categoryGachas.length,
      },
    });
  }),
];
