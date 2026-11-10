import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';

import HomePage from '@/routes/home/HomePage';
import { nearbyStoresMockResponse } from '@/routes/search/mocks/nearbyStoresMock';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { storeDetailHandlers } from './mocks/storeDetailHandlers';
import { createStoreGachaMockResponse } from './mocks/storeGachaMock';
import { StoreDetailRoute } from './route';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('매장 상세 탐색', () => {
  it('8개씩 이어서 조회하고 마지막 페이지에서 더보기를 숨긴다', async () => {
    jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const requests: URLSearchParams[] = [];
    server.use(...storeDetailHandlers);
    server.use(
      http.get('/api/v1/stores/1/gachas', ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        return HttpResponse.json(
          createStoreGachaMockResponse(
            1,
            Number(params.get('page')),
            Number(params.get('size')),
          ),
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<StoreDetailRoute />, {
      route: '/stores/1',
      initialAccessToken: null,
    });
    const catalog = await screen.findByRole('region', {
      name: '이 매장의 가챠',
    });
    await waitFor(() =>
      expect(within(catalog).getAllByRole('link')).toHaveLength(8),
    );
    await user.click(within(catalog).getByRole('button', { name: '더보기' }));
    await waitFor(() =>
      expect(within(catalog).getAllByRole('link')).toHaveLength(12),
    );
    expect(
      within(catalog).queryByRole('button', { name: '더보기' }),
    ).not.toBeInTheDocument();
    expect(
      requests.map((params) => [params.get('page'), params.get('size')]),
    ).toEqual([
      ['0', '8'],
      ['1', '8'],
    ]);
  });

  it('매장 가챠에서 상세로 이동해 매장 복귀와 보유 매장 지도 진입을 제공한다', async () => {
    const scroll = jest
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    server.use(
      ...storeDetailHandlers,
      http.get('/api/v1/gachas/10', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            gachaId: 10,
            name: '산리오 캐릭터즈 스탠드 피규어',
            thumbnailUrl: null,
            categories: ['산리오'],
            storeCount: 2,
          },
        }),
      ),
      http.get('/api/v1/stores/nearby/10', () =>
        HttpResponse.json(nearbyStoresMockResponse),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/stores/:id" element={<StoreDetailRoute />} />
        <Route path="/search" element={<HomePage />} />
      </Routes>,
      { route: '/stores/1', initialAccessToken: null },
    );
    const card = await screen.findByRole('link', {
      name: '산리오 캐릭터즈 스탠드 피규어 가챠 상세 보기',
    });
    scroll.mockClear();
    await user.click(card);
    expect(
      await screen.findByRole('heading', {
        name: '산리오 캐릭터즈 스탠드 피규어',
      }),
    ).toBeInTheDocument();
    expect(scroll).toHaveBeenCalledWith(0, 0);
    expect(
      screen.getByRole('link', { name: /매장 상세로 돌아가기/ }),
    ).toHaveAttribute('href', '/stores/1');
    expect(
      screen.getByRole('link', { name: '보유 매장 지도에서 보기' }),
    ).toHaveAttribute('href', '/map?gachaId=10');
    await user.click(
      screen.getByRole('link', { name: /매장 상세로 돌아가기/ }),
    );
    expect(
      await screen.findByRole('heading', { name: '홍대 가챠 스테이션' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '지도로 돌아가기', hidden: true }),
    ).toHaveAttribute('href', '/map');
  });
});
