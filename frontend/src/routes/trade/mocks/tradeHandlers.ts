import { http, HttpResponse } from 'msw';

import type { CreateTradeRequest } from '@/domains/trade/tradeCreateType';
import type { TradeDetail } from '@/domains/trade/tradeDetailType';

import { TRADE_ITEMS } from '../storybook/tradeMocks';

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
const MOCK_TRADE_IMAGE_URL = 'https://placehold.co/800x800/png?text=Gacha';
let createdTrade: TradeDetail | null = null;
const updatedTrades = new Map<number, TradeDetail>();

function toTradePlace(place: CreateTradeRequest['tradePlace']) {
  return place ? { ...place, name: place.name ?? null } : null;
}

function toCategoryNames(categoryIds: number[] = []) {
  return categoryIds.flatMap((categoryId) => {
    const category = TRADE_CATEGORIES.find(
      (candidate) => candidate.categoryId === categoryId,
    );

    return category ? [category.name] : [];
  });
}

async function readTradeRequest(
  request: Request,
): Promise<{ tradeRequest: CreateTradeRequest; images: File[] } | null> {
  const formData = await request.formData();
  const requestPart = formData.get('request');

  if (!(requestPart instanceof File)) {
    return null;
  }

  return {
    tradeRequest: JSON.parse(await requestPart.text()) as CreateTradeRequest,
    images: formData
      .getAll('images')
      .filter((image): image is File => image instanceof File),
  };
}

function findTradeDetail(tradeId: number): TradeDetail | null {
  const updatedTrade = updatedTrades.get(tradeId);

  if (updatedTrade) {
    return updatedTrade;
  }

  if (createdTrade?.tradeId === tradeId) {
    return createdTrade;
  }

  const trade = TRADE_ITEMS.find((item) => item.tradeId === tradeId);

  if (!trade) {
    return null;
  }

  return {
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
    imageUrls: [trade.thumbnailUrl ?? MOCK_TRADE_IMAGE_URL],
    createdAt: trade.createdAt,
    updatedAt: trade.createdAt,
  };
}

export const tradeHandlers = [
  http.post(TRADES_API_PATH, async ({ request }) => {
    const parsedRequest = await readTradeRequest(request);

    if (!parsedRequest) {
      return HttpResponse.json(
        { code: 'CE001', message: '게시글 본문이 필요합니다.' },
        { status: 400 },
      );
    }

    const { tradeRequest } = parsedRequest;
    const categoryNames = toCategoryNames(tradeRequest.categoryIds);
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
      availableTime: null,
      imageUrls: [MOCK_TRADE_IMAGE_URL],
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
      data: { items: categories },
    });
  }),
  http.get(`${TRADES_API_PATH}/:tradeId`, ({ params }) => {
    const trade = findTradeDetail(Number(params.tradeId));

    if (!trade) {
      return HttpResponse.json(
        { code: 'TE001', message: '교환 게시글을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json({ code: 'C000', message: '정상', data: trade });
  }),
  http.put(`${TRADES_API_PATH}/:tradeId`, async ({ params, request }) => {
    const trade = findTradeDetail(Number(params.tradeId));

    if (!trade) {
      return HttpResponse.json(
        { code: 'TE001', message: '교환 게시글을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const parsedRequest = await readTradeRequest(request);

    if (!parsedRequest) {
      return HttpResponse.json(
        { code: 'CE001', message: '게시글 본문이 필요합니다.' },
        { status: 400 },
      );
    }

    const { tradeRequest, images } = parsedRequest;
    const updatedTrade: TradeDetail = {
      ...trade,
      title: tradeRequest.title,
      description: tradeRequest.description ?? null,
      desiredProduction: tradeRequest.desiredProduction ?? null,
      categories: toCategoryNames(tradeRequest.categoryIds),
      purchaseStore: toTradePlace(tradeRequest.purchaseStore),
      tradePlace: toTradePlace(tradeRequest.tradePlace),
      // 새 이미지가 없으면 기존 이미지를 유지하고, 있으면 전부 교체한다.
      imageUrls:
        images.length > 0
          ? images.map(
              (_, index) =>
                `https://placehold.co/800x800/png?text=New+${index + 1}`,
            )
          : trade.imageUrls,
      updatedAt: new Date().toISOString(),
    };

    updatedTrades.set(updatedTrade.tradeId, updatedTrade);

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: updatedTrade,
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
      ? TRADE_ITEMS.filter((trade) =>
          trade.title.toLocaleLowerCase('ko-KR').includes(keyword),
        )
      : TRADE_ITEMS;
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
