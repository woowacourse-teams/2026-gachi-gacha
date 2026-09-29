import { http, HttpResponse } from 'msw';

import { SECONDHAND_ITEMS } from '../storybook/secondhandMocks';

const TRADES_API_PATH = '/api/v1/trades';

export const tradeHandlers = [
  http.get(`${TRADES_API_PATH}/:tradeId`, ({ params }) => {
    const tradeId = Number(params.tradeId);
    const trade = SECONDHAND_ITEMS.find((item) => item.tradeId === tradeId);

    if (!trade) {
      return HttpResponse.json(
        { code: 'TE001', message: '교환 게시글을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        tradeId: trade.tradeId,
        memberId: trade.memberId,
        title: trade.title,
        description: '소중하게 보관한 가챠입니다. 상태를 확인한 뒤 교환해요.',
        desiredProduction: '같은 카테고리의 다른 가챠',
        categories: trade.categories,
        status: trade.status,
        purchaseStore: null,
        tradePlace: trade.tradePlace
          ? {
              ...trade.tradePlace,
              latitude: 37.557,
              longitude: 126.9245,
            }
          : null,
        availableTime: null,
        imageUrls: trade.thumbnailUrl ? [trade.thumbnailUrl] : [],
        createdAt: trade.createdAt,
        updatedAt: trade.createdAt,
      },
    });
  }),
  http.get(TRADES_API_PATH, ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const page = Number(searchParams.get('page') ?? 0);
    const size = Number(searchParams.get('size') ?? 20);
    const keyword = searchParams
      .get('keyword')
      ?.trim()
      .toLocaleLowerCase('ko-KR');
    const content = keyword
      ? SECONDHAND_ITEMS.filter((trade) =>
          trade.title.toLocaleLowerCase('ko-KR').includes(keyword),
        )
      : SECONDHAND_ITEMS;
    const pageContent = content.slice(page * size, (page + 1) * size);
    const totalPages =
      content.length > 0 ? Math.ceil(content.length / size) : 0;

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        content: pageContent,
        pageable: {
          pageNumber: page,
          pageSize: size,
        },
        totalElements: content.length,
        totalPages,
        first: page === 0,
        last: page + 1 >= totalPages,
        size,
        number: page,
        numberOfElements: pageContent.length,
        empty: pageContent.length === 0,
      },
    });
  }),
];
