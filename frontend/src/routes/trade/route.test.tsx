import { describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { TradeRoute } from './route';

function createTradePage(keyword: string | null) {
  const content = keyword
    ? [
        {
          tradeId: 15,
          memberId: 3,
          title: '쿠로미 피규어 교환해요',
          status: 'AVAILABLE',
          categories: ['피규어', '산리오'],
          thumbnailUrl: null,
          tradePlace: {
            name: '홍대입구역 8번 출구',
            address: '서울특별시 마포구 양화로 160',
          },
          createdAt: '2026-09-17T14:30:00',
        },
      ]
    : [
        {
          tradeId: 20,
          memberId: 4,
          title: '최신 교환 게시글',
          status: 'IN_PROGRESS',
          categories: [],
          thumbnailUrl: null,
          tradePlace: null,
          createdAt: '2026-09-29T10:00:00',
        },
      ];

  return {
    code: 'C000',
    message: '정상',
    data: {
      content,
      pageable: { pageNumber: 0, pageSize: 20 },
      totalElements: content.length,
      totalPages: 1,
      first: true,
      last: true,
      size: 20,
      number: 0,
      numberOfElements: content.length,
      empty: false,
    },
  };
}

function createPaginatedTradePage(page: number) {
  const tradeId = page + 1;

  return {
    code: 'C000',
    message: '정상',
    data: {
      content: [
        {
          tradeId,
          memberId: tradeId,
          title: `${page + 1}페이지 교환 게시글`,
          status: 'AVAILABLE',
          categories: [],
          thumbnailUrl: null,
          tradePlace: null,
          createdAt: '2026-09-29T10:00:00',
        },
      ],
      pageable: { pageNumber: page, pageSize: 20 },
      totalElements: 2,
      totalPages: 2,
      first: page === 0,
      last: page === 1,
      size: 20,
      number: page,
      numberOfElements: 1,
      empty: false,
    },
  };
}

describe('교환 게시글 검색', () => {
  it('검색 URL의 검색어를 API에 전달하고 MSW 응답 게시글을 보여준다', async () => {
    const requestedUrls: URL[] = [];

    server.use(
      http.get('/api/v1/trades', ({ request }) => {
        const url = new URL(request.url);
        requestedUrls.push(url);

        return HttpResponse.json(
          createTradePage(url.searchParams.get('keyword')),
        );
      }),
    );
    renderWithProviders(<TradeRoute />, {
      route: '/trade?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8',
    });

    expect(
      await screen.findByRole('heading', {
        name: '쿠로미 피규어 교환해요',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '‘쿠로미’ 검색결과' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('searchbox', { name: '중고거래 게시글 검색어' }),
    ).toHaveValue('쿠로미');

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    const searchRequest = requestedUrls[0]!;

    expect(searchRequest.searchParams.get('keyword')).toBe('쿠로미');
    expect(searchRequest.searchParams.get('page')).toBe('0');
    expect(searchRequest.searchParams.get('size')).toBe('20');
    expect(searchRequest.searchParams.get('sort')).toBe('createdAt,desc');
    expect(window.location.search).toBe('?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8');
  });

  it('더보기를 누르면 다음 페이지 게시글을 기존 목록에 추가한다', async () => {
    const requestedPages: number[] = [];

    server.use(
      http.get('/api/v1/trades', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));

        requestedPages.push(page);

        return HttpResponse.json(createPaginatedTradePage(page));
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<TradeRoute />, { route: '/trade' });

    expect(
      await screen.findByRole('heading', { name: '1페이지 교환 게시글' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '더보기' }));

    expect(
      await screen.findByRole('heading', { name: '2페이지 교환 게시글' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '1페이지 교환 게시글' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더보기' })).toBeNull();
    expect(requestedPages).toEqual([0, 1]);
  });
});
