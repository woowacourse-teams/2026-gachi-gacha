import { delay, http, HttpResponse } from 'msw';

import type { TradeSummary } from '@/domains/trade/tradeSummaryType';
import { AUTH_STORY_TOKEN } from '@/features/auth/mocks/authHandlers';

const MY_TRADES_API_PATH = '/api/v1/trades/me';
const SUPPORT_INQUIRY_API_PATH = '/api/v1/support-inquiries';

const tradeSummaries: TradeSummary[] = [
  {
    tradeId: 17,
    memberId: 1,
    title: '쿠로미 미니 피규어 vol.2 교환해요',
    status: 'IN_PROGRESS',
    categories: ['산리오', '피규어'],
    thumbnailUrl: null,
    tradePlace: '홍대입구역 8번 출구',
    createdAt: '2026-09-25T19:30:00',
  },
  {
    tradeId: 12,
    memberId: 1,
    title: '폼폼푸린 푸딩 컵',
    status: 'AVAILABLE',
    categories: ['산리오'],
    thumbnailUrl: null,
    tradePlace: '합정역',
    createdAt: '2026-09-22T14:10:00',
  },
  {
    tradeId: 8,
    memberId: 1,
    title: '짱구 잠옷 피규어',
    status: 'COMPLETED',
    categories: ['짱구', '미니어처'],
    thumbnailUrl: null,
    tradePlace: '연남동',
    createdAt: '2026-09-18T11:20:00',
  },
];

function createTradePage(content: TradeSummary[], totalElements: number) {
  return {
    code: 'C000',
    message: '요청에 성공했습니다.',
    data: {
      content,
      totalElements,
      totalPages: totalElements > 0 ? 1 : 0,
      number: 0,
      size: Math.max(content.length, 1),
    },
  };
}

export const myTradesHandler = http.get(MY_TRADES_API_PATH, ({ request }) => {
  if (request.headers.get('Authorization') !== `Bearer ${AUTH_STORY_TOKEN}`) {
    return HttpResponse.json(
      { code: 'A001', message: '인증이 필요합니다.', data: null },
      { status: 401 },
    );
  }

  const status = new URL(request.url).searchParams.get('status');

  if (status === 'IN_PROGRESS') {
    const inProgressTrades = tradeSummaries.filter(
      (trade) => trade.status === 'IN_PROGRESS',
    );

    return HttpResponse.json(
      createTradePage(inProgressTrades, inProgressTrades.length),
    );
  }

  return HttpResponse.json(createTradePage(tradeSummaries, 6));
});

export const emptyMyTradesHandler = http.get(MY_TRADES_API_PATH, () =>
  HttpResponse.json(createTradePage([], 0)),
);

export const failedMyTradesHandler = http.get(MY_TRADES_API_PATH, () =>
  HttpResponse.json(
    {
      code: 'S001',
      message: '내 교환글을 불러오지 못했습니다.',
      data: null,
    },
    { status: 500 },
  ),
);

export const loadingMyTradesHandler = http.get(MY_TRADES_API_PATH, async () => {
  await delay('infinite');
});

export const supportInquirySuccessHandler = http.post(
  SUPPORT_INQUIRY_API_PATH,
  () =>
    HttpResponse.json(
      {
        code: 'C001',
        message: '문의가 접수되었습니다.',
        data: { inquiryId: 1 },
      },
      { status: 201 },
    ),
);
