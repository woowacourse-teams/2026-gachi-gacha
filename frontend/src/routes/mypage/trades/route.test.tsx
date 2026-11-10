import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import {
  AUTH_STORY_REFRESH_TOKEN,
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { MyTradesRoute } from './route';

function createTrade(tradeId: number, status = 'AVAILABLE') {
  return {
    tradeId,
    memberId: 1,
    title: `${tradeId}번 내 교환글`,
    status,
    categories: ['산리오', '피규어'],
    thumbnailUrl: null,
    tradePlace: {
      name: '홍대입구역',
      address: '서울특별시 마포구',
    },
    createdAt: '2026-10-17T10:00:00',
  };
}

function createTradePage({
  page = 0,
  status = 'AVAILABLE',
  totalPages = 1,
}: {
  page?: number;
  status?: string;
  totalPages?: number;
} = {}) {
  return {
    code: 'C000',
    message: '요청에 성공했습니다.',
    data: {
      content: [createTrade(page + 1, status)],
      totalElements: totalPages,
      totalPages,
      number: page,
      size: 10,
    },
  };
}

function mockMobileViewport() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

describe('내 글', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
  });

  it('웹에서는 왼쪽 메뉴와 함께 본인 글 첫 6개를 카드로 보여준다', async () => {
    const requestedUrls: URL[] = [];

    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', ({ request }) => {
        requestedUrls.push(new URL(request.url));

        return HttpResponse.json(createTradePage());
      }),
    );

    renderWithProviders(<MyTradesRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage/trades',
    });

    expect(await screen.findByText('1번 내 교환글')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '내 글' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1번 내 교환글/ })).toHaveAttribute(
      'href',
      '/trade/1',
    );
    expect(
      screen.queryByRole('link', { name: '1번 내 교환글 수정' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '내 글', current: 'page' }),
    ).toHaveAttribute('href', '/mypage/trades');

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    expect(requestedUrls[0]!.searchParams.get('page')).toBe('0');
    expect(requestedUrls[0]!.searchParams.get('size')).toBe('6');
    expect(requestedUrls[0]!.searchParams.has('status')).toBe(false);
  });

  it('상태 필터를 URL과 API 요청에 함께 반영한다', async () => {
    const requestedStatuses: Array<string | null> = [];
    const user = userEvent.setup();

    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        requestedStatuses.push(status);

        return HttpResponse.json(
          createTradePage({ status: status ?? 'AVAILABLE' }),
        );
      }),
    );

    renderWithProviders(<MyTradesRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage/trades',
    });

    await screen.findByText('1번 내 교환글');
    await user.click(screen.getByRole('button', { name: '교환 완료' }));

    await waitFor(() => {
      expect(requestedStatuses).toEqual([null, 'COMPLETED']);
    });
    expect(window.location.search).toBe('?status=COMPLETED');
    expect(screen.getByRole('button', { name: '교환 완료' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('더보기를 누르면 다음 페이지를 기존 내역에 이어 붙인다', async () => {
    const requestedPages: number[] = [];
    const user = userEvent.setup();

    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        requestedPages.push(page);

        return HttpResponse.json(createTradePage({ page, totalPages: 2 }));
      }),
    );

    renderWithProviders(<MyTradesRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage/trades',
    });

    await screen.findByText('1번 내 교환글');
    await user.click(screen.getByRole('button', { name: '더보기' }));

    expect(await screen.findByText('2번 내 교환글')).toBeInTheDocument();
    expect(screen.getByText('1번 내 교환글')).toBeInTheDocument();
    expect(requestedPages).toEqual([0, 1]);
  });

  it('작성한 글이 없으면 교환글 작성 동선을 제공한다', async () => {
    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 10,
          },
        }),
      ),
    );

    renderWithProviders(<MyTradesRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage/trades',
    });

    expect(
      await screen.findByText('아직 작성한 글이 없어요'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '교환글 작성하기' }),
    ).toHaveAttribute('href', '/trade/new');
  });

  it('모바일에서는 뒤로 가기 상단 바와 글 행 목록만 보여준다', async () => {
    const requestedSizes: Array<string | null> = [];

    mockMobileViewport();
    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', ({ request }) => {
        requestedSizes.push(new URL(request.url).searchParams.get('size'));

        return HttpResponse.json(createTradePage({ totalPages: 2 }));
      }),
    );

    renderWithProviders(<MyTradesRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage/trades',
    });

    expect(await screen.findByText('1번 내 교환글')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '마이로 돌아가기' }),
    ).toHaveAttribute('href', '/mypage');
    expect(
      screen.queryByRole('navigation', { name: '마이 메뉴' }),
    ).not.toBeInTheDocument();
    expect(requestedSizes).toEqual(['10']);
  });
});
