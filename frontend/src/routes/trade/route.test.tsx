import { beforeEach, describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { MemberBlockProvider } from '@/features/memberSafety/MemberBlockContext';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { submitSearchForm } from '@/test/submitSearchForm';

import { TradeRoute } from './route';

beforeEach(() => {
  window.localStorage.clear();
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

    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('');

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    const searchRequest = requestedUrls[0]!;

    expect(searchRequest.searchParams.get('keyword')).toBe('쿠로미');
    expect(searchRequest.searchParams.get('page')).toBe('0');
    expect(searchRequest.searchParams.get('size')).toBe('20');
    expect(searchRequest.searchParams.get('sort')).toBe('createdAt,desc');
    expect(window.location.search).toBe('?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8');
  });

  it('URL의 빠른 검색어·교환 상태·정렬을 화면과 API 요청에 복원한다', async () => {
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
        '/trade?quickKeyword=%EC%82%B0%EB%A6%AC%EC%98%A4&status=AVAILABLE&sort=oldest',
    });

    expect(
      await screen.findByRole('heading', { name: '쿠로미 피규어 교환해요' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '산리오 교환글' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '산리오' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('');
    expect(
      screen.getByRole('combobox', { name: '교환 상태' }),
    ).toHaveTextContent('교환 가능');
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveTextContent(
      '오래된순',
    );

    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    const requestUrl = requestedUrls[0]!;

    expect(requestUrl.searchParams.get('keyword')).toBe('산리오');
    expect(requestUrl.searchParams.get('categoryIds')).toBeNull();
    expect(requestUrl.searchParams.get('status')).toBe('AVAILABLE');
    expect(requestUrl.searchParams.get('sort')).toBe('createdAt,asc');
  });

  it('카테고리 핫키가 직접 검색어를 대체하고 다른 필터와 함께 유지된다', async () => {
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
    const user = userEvent.setup();

    renderWithProviders(<TradeRoute />, {
      route: '/trade?keyword=%EC%BF%A0%EB%A1%9C%EB%AF%B8',
    });

    await screen.findByRole('heading', { name: '쿠로미 피규어 교환해요' });
    await user.click(screen.getByRole('button', { name: '산리오' }));
    await user.click(screen.getByRole('combobox', { name: '교환 상태' }));
    await user.click(screen.getByRole('option', { name: '교환 가능' }));
    await user.click(screen.getByRole('combobox', { name: '정렬' }));
    await user.click(screen.getByRole('option', { name: '오래된순' }));
    await waitFor(() => {
      const currentSearchParams = new URLSearchParams(window.location.search);

      expect(currentSearchParams.get('keyword')).toBeNull();
      expect(currentSearchParams.get('quickKeyword')).toBe('산리오');
      expect(currentSearchParams.get('categoryId')).toBeNull();
      expect(currentSearchParams.get('status')).toBe('AVAILABLE');
      expect(currentSearchParams.get('sort')).toBe('oldest');
    });
    await waitFor(() =>
      expect(requestedUrls.at(-1)?.searchParams.get('keyword')).toBe('산리오'),
    );
    expect(requestedUrls.at(-1)?.searchParams.get('categoryIds')).toBeNull();
    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('');
    expect(
      screen.getByRole('heading', { name: '산리오 교환글' }),
    ).toBeInTheDocument();
  });

  it('홈 헤더에서 검색하면 통합 검색 경로로 이동한다', async () => {
    server.use(
      http.get('/api/v1/trades', () =>
        HttpResponse.json(createTradePage('치이카와')),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<TradeRoute />, {
      route: '/trade?quickKeyword=치이카와',
    });
    await screen.findByRole('heading', { name: '치이카와 교환글' });
    await user.type(
      screen.getByRole('searchbox', { name: '검색어' }),
      '쿠로미',
    );
    submitSearchForm(
      screen.getByRole('search', { name: '통합 검색' }) as HTMLFormElement,
    );
    expect(window.location.pathname).toBe('/search');
    expect(new URLSearchParams(window.location.search).get('keyword')).toBe(
      '쿠로미',
    );
    expect(
      new URLSearchParams(window.location.search).get('quickKeyword'),
    ).toBeNull();
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
      route:
        '/trade?quickKeyword=%EC%82%B0%EB%A6%AC%EC%98%A4&status=AVAILABLE&sort=oldest',
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
    expect(requestedUrls[1]!.searchParams.get('keyword')).toBe('산리오');
    expect(requestedUrls[1]!.searchParams.get('categoryIds')).toBeNull();
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
      name: '교환 글쓰기',
    });

    expect(createLink).toHaveAttribute('href', '/trade/new');

    await user.click(createLink);

    expect(window.location.pathname).toBe('/trade/new');
  });
});
