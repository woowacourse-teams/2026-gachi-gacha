import { http, HttpResponse } from 'msw';

import type { CreateTradeRequest } from '@/domains/trade/tradeCreateType';
import type { TradeDetail } from '@/domains/trade/tradeDetailType';

import { SECONDHAND_ITEMS } from '../storybook/secondhandMocks';

const TRADES_API_PATH = '/api/v1/trades';
const CATEGORIES_API_PATH = '/api/v1/categories';
const TRADE_CATEGORIES = [
  { categoryId: 1, name: '산리오' },
  { categoryId: 2, name: '키링' },
  { categoryId: 3, name: '피규어' },
  { categoryId: 4, name: '미니어처' },
  { categoryId: 5, name: '포켓몬' },
  { categoryId: 6, name: '치이카와' },
];
let createdTrade: TradeDetail | null = null;

function toTradePlace(place: CreateTradeRequest['tradePlace']) {
  return place ? { ...place, name: place.name ?? null } : null;
}

export const tradeHandlers = [
  http.post(TRADES_API_PATH, async ({ request }) => {
    const formData = await request.formData();
    const requestPart = formData.get('request');

    if (!(requestPart instanceof File)) {
      return HttpResponse.json(
        { code: 'CE001', message: '게시글 본문이 필요합니다.' },
        { status: 400 },
      );
    }

    const tradeRequest = JSON.parse(
      await requestPart.text(),
    ) as CreateTradeRequest;
    const categoryNames = (tradeRequest.categoryIds ?? []).flatMap(
      (categoryId) => {
        const category = TRADE_CATEGORIES.find(
          (candidate) => candidate.categoryId === categoryId,
        );

        return category ? [category.name] : [];
      },
    );
    const createdAt = new Date().toISOString();

    createdTrade = {
      tradeId: 99,
      memberId: 3,
      title: tradeRequest.title,
      description: tradeRequest.description ?? null,
      desiredProduction: tradeRequest.desiredProduction ?? null,
      categories: categoryNames,
      status: 'AVAILABLE',
      purchaseStore: toTradePlace(tradeRequest.purchaseStore),
      tradePlace: toTradePlace(tradeRequest.tradePlace),
      availableTime: tradeRequest.availableTime ?? null,
      imageUrls: ['https://placehold.co/800x800/png?text=Gacha'],
      createdAt,
      updatedAt: createdAt,
    };

    return HttpResponse.json(
      { code: 'C001', message: '정상 생성', data: createdTrade },
      { status: 201 },
    );
  }),
  http.get(CATEGORIES_API_PATH, ({ request }) => {
    const keyword = new URL(request.url).searchParams
      .get('keyword')
      ?.trim()
      .toLocaleLowerCase('ko-KR');
    const categories = keyword
      ? TRADE_CATEGORIES.filter((category) =>
          category.name.toLocaleLowerCase('ko-KR').includes(keyword),
        )
      : TRADE_CATEGORIES;

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: categories,
    });
  }),
  http.get(`${TRADES_API_PATH}/:tradeId`, ({ params }) => {
    const tradeId = Number(params.tradeId);

    if (createdTrade?.tradeId === tradeId) {
      return HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: createdTrade,
      });
    }

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
