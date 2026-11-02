import { beforeEach, describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { MemberBlockProvider } from '@/features/memberSafety/MemberBlockContext';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { TradeRoute } from './route';

beforeEach(() => {
  window.localStorage.clear();
  server.use(
    http.get('/api/v1/categories', () =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: {
          items: [
            { categoryId: 1, name: '산리오' },
            { categoryId: 2, name: '치이카와' },
            { categoryId: 3, name: '포켓몬' },
            { categoryId: 4, name: '짱구' },
            { categoryId: 5, name: '디즈니' },
          ],
        },
      }),
    ),
  );
});

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
  it('로컬 차단 상태에 있는 작성자의 이미 로드된 게시글을 숨긴다', async () => {
    window.localStorage.setItem(
      'gachi-gacha:blocked-member-ids:v1',
      JSON.stringify([4]),
    );
    server.use(
      http.get('/api/v1/trades', () =>
        HttpResponse.json(createTradePage(null)),
      ),
    );

    renderWithProviders(
      <MemberBlockProvider>
        <TradeRoute />
      </MemberBlockProvider>,
      { route: '/trade' },
    );

    expect(
      await screen.findByText('아직 등록된 교환 게시글이 없어요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '최신 교환 게시글' }),
    ).not.toBeInTheDocument();
  });

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
      screen.getByRole('searchbox', { name: '교환 게시글 검색어' }),
    ).toHaveValue('쿠로미');

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    const searchRequest = requestedUrls[0]!;

    expect(searchRequest.searchParams.get('keyword')).toBe('쿠로미');
    expect(searchRequest.searchParams.get('page')).toBe('0');
    expect(searchRequest.searchParams.get('size')).toBe('20');
    expect(searchRequest.searchParams.get('sort')).toBe('createdAt,desc');
    expect(window.location.search).toBe('?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8');
  });

  it('URL의 카테고리·교환 상태·정렬을 화면과 API 요청에 복원한다', async () => {
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
      route:
        '/trade?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8&categoryId=1&status=AVAILABLE&sort=oldest',
    });

    expect(
      await screen.findByRole('heading', { name: '쿠로미 피규어 교환해요' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '산리오' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(screen.getByRole('combobox', { name: '교환 상태' })).toHaveValue(
      'AVAILABLE',
    );
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveValue(
      'oldest',
    );

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    const requestUrl = requestedUrls[0]!;

    expect(requestUrl.searchParams.get('keyword')).toBe('쿠로미');
    expect(requestUrl.searchParams.get('categoryIds')).toBe('1');
    expect(requestUrl.searchParams.get('status')).toBe('AVAILABLE');
    expect(requestUrl.searchParams.get('sort')).toBe('createdAt,asc');
  });

  it('필터를 변경해도 기존 검색어를 URL에 함께 보존한다', async () => {
    server.use(
      http.get('/api/v1/trades', ({ request }) =>
        HttpResponse.json(
          createTradePage(new URL(request.url).searchParams.get('keyword')),
        ),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<TradeRoute />, {
      route: '/trade?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8',
    });

    await screen.findByRole('heading', { name: '쿠로미 피규어 교환해요' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '산리오' })).toBeEnabled(),
    );

    await user.click(screen.getByRole('button', { name: '산리오' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: '교환 상태' }),
      'AVAILABLE',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: '정렬' }),
      'oldest',
    );
    await waitFor(() => {
      const currentSearchParams = new URLSearchParams(window.location.search);

      expect(currentSearchParams.get('keyword')).toBe('쿠로미');
      expect(currentSearchParams.get('categoryId')).toBe('1');
      expect(currentSearchParams.get('status')).toBe('AVAILABLE');
      expect(currentSearchParams.get('sort')).toBe('oldest');
    });
  });

  it('더보기를 누르면 다음 페이지 게시글을 기존 목록에 추가한다', async () => {
    const requestedUrls: URL[] = [];

    server.use(
      http.get('/api/v1/trades', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page'));

        requestedUrls.push(url);

        return HttpResponse.json(createPaginatedTradePage(page));
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<TradeRoute />, {
      route: '/trade?categoryId=1&status=AVAILABLE&sort=oldest',
    });

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
    expect(requestedUrls.map((url) => url.searchParams.get('page'))).toEqual([
      '0',
      '1',
    ]);
    expect(requestedUrls[1]!.searchParams.get('categoryIds')).toBe('1');
    expect(requestedUrls[1]!.searchParams.get('status')).toBe('AVAILABLE');
    expect(requestedUrls[1]!.searchParams.get('sort')).toBe('createdAt,asc');
  });
});

describe('교환 글 등록 버튼', () => {
  it('교환 탭 우측 하단의 + 버튼을 누르면 교환 글 등록 화면으로 이동한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/v1/trades', () =>
        HttpResponse.json(createTradePage(null)),
      ),
    );

    renderWithProviders(<TradeRoute />, { route: '/trade' });

    const createLink = await screen.findByRole('link', {
      name: '교환 글 등록',
    });

    expect(createLink).toHaveAttribute('href', '/trade/new');

    await user.click(createLink);

    expect(window.location.pathname).toBe('/trade/new');
  });
});
