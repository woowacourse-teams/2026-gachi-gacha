import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { nearbyStoresMockResponse } from '@/routes/search/mocks/nearbyStoresMock';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import HomePage from './HomePage';
import { TRADE_ITEMS } from '../trade/storybook/tradeMocks';

beforeEach(() => {
  jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('교환글 검색', () => {
  it('URL에서 복원한 검색어를 최초 조회와 더보기 요청에 보낸다', async () => {
    const requests: Array<{ keyword: string | null; page: string | null }> = [];
    server.use(
      http.get('/api/v1/trades', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = params.get('page');
        requests.push({ keyword: params.get('keyword'), page });

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content: [page === '1' ? TRADE_ITEMS[1] : TRADE_ITEMS[0]],
            totalElements: 2,
            totalPages: 2,
            number: Number(page),
            size: 20,
          },
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<HomePage />, {
      initialAccessToken: null,
      route: '/search?keyword=산리오&tab=trade',
    });

    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue(
      '산리오',
    );

    await user.click(await screen.findByRole('button', { name: '더보기' }));
    expect(
      await screen.findByRole('link', { name: /포켓몬 피규어 컬렉션/ }),
    ).toHaveAttribute('href', '/trade/2');
    expect(requests).toEqual([
      { keyword: '산리오', page: '0' },
      { keyword: '산리오', page: '1' },
    ]);
  });
  it('전체에서 네 탭을 제공하고 검색어를 유지해 가챠 상세와 매장 결과로 이동한다', async () => {
    const gacha = {
      gachaId: 42,
      name: '홍대 한정 피규어',
      thumbnailUrl: null,
      categories: ['홍대'],
      storeCount: 2,
    };
    server.use(
      http.get('/api/v1/trades', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
          },
        }),
      ),
      http.get('/api/v1/categories', ({ request }) => {
        expect(new URL(request.url).searchParams.get('keyword')).toBe('홍대');
        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { items: [{ categoryId: 7, name: '홍대' }] },
        });
      }),
      http.get('/api/v1/gachas', ({ request }) => {
        expect(new URL(request.url).searchParams.get('categoryIds')).toBe('7');
        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { content: [gacha], totalElements: 1 },
        });
      }),
      http.get('/api/v1/gachas/42', () =>
        HttpResponse.json({ code: 'C000', message: '정상', data: gacha }),
      ),
      http.get('/api/v1/stores/nearby/42', () =>
        HttpResponse.json(nearbyStoresMockResponse),
      ),
      http.get('/api/v1/stores/nearby', () =>
        HttpResponse.json(nearbyStoresMockResponse),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<HomePage />, {
      initialAccessToken: null,
      route: '/search?keyword=홍대',
    });

    const tabs = screen.getByRole('navigation', { name: '검색 결과 유형' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['전체', '교환글', '가챠', '매장']);
    expect(within(tabs).getByRole('link', { name: '전체' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      await screen.findByRole('link', { name: /홍대 가챠 스테이션/ }),
    ).toHaveAttribute('href', '/stores/1');

    await user.click(within(tabs).getByRole('link', { name: '가챠' }));
    await user.click(
      await screen.findByRole('link', { name: /홍대 한정 피규어/ }),
    );
    expect(
      await screen.findByRole('heading', { name: '홍대 한정 피규어' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '보유 매장 지도에서 보기' }),
    ).toHaveAttribute('href', '/map?gachaId=42');
    await user.click(
      screen.getByRole('link', { name: /검색 결과로 돌아가기/ }),
    );

    await user.click(screen.getByRole('link', { name: '매장' }));
    expect(new URLSearchParams(window.location.search).get('keyword')).toBe(
      '홍대',
    );
    expect(
      await screen.findByRole('link', { name: /홍대 가챠 스테이션/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /연남 캡슐토이/ }),
    ).not.toBeInTheDocument();
  });
});
