import { beforeEach, describe, expect, it } from '@jest/globals';
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

describe('내 교환글 전체보기', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
  });

  it('본인 교환글 API의 첫 페이지를 불러와 관리 동선을 제공한다', async () => {
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
    expect(screen.getByText('총 1개')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '1번 내 교환글 거래글 보기' }),
    ).toHaveAttribute('href', '/trade/1');
    expect(
      screen.getByRole('link', { name: '1번 내 교환글 수정' }),
    ).toHaveAttribute('href', '/trade/1/edit');
    expect(
      screen.getByRole('button', { name: '1번 내 교환글 삭제' }),
    ).toBeInTheDocument();

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    expect(requestedUrls[0]!.searchParams.get('page')).toBe('0');
    expect(requestedUrls[0]!.searchParams.get('size')).toBe('10');
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
    await user.click(screen.getByRole('button', { name: '교환글 더보기' }));

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
      await screen.findByText('아직 작성한 교환글이 없어요'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '교환글 작성하기' }),
    ).toHaveAttribute('href', '/trade/new');
  });
});
