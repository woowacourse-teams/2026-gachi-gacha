import { http, HttpResponse } from 'msw';

import { SECONDHAND_ITEMS } from '../storybook/secondhandMocks';

const TRADES_API_PATH = '/api/v1/trades';

export const tradeHandlers = [
  http.get(TRADES_API_PATH, ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const keyword = searchParams
      .get('keyword')
      ?.trim()
      .toLocaleLowerCase('ko-KR');
    const content = keyword
      ? SECONDHAND_ITEMS.filter((trade) =>
          trade.title.toLocaleLowerCase('ko-KR').includes(keyword),
        )
      : SECONDHAND_ITEMS;

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        content,
        pageable: {
          pageNumber: 0,
          pageSize: 20,
        },
        totalElements: content.length,
        totalPages: content.length > 0 ? 1 : 0,
        first: true,
        last: true,
        size: 20,
        number: 0,
        numberOfElements: content.length,
        empty: content.length === 0,
      },
    });
  }),
];
