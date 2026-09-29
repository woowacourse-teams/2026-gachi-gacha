import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import { server } from '@/test/server';

import { GachaSearchNavigationBar } from './GachaSearchNavigationBar';

jest.mock('@/shared/browser/browserNavigation', () => ({
  assignBrowserLocation: jest.fn(),
  replaceBrowserLocation: jest.fn(),
}));

const mockedAssignBrowserLocation = jest.mocked(assignBrowserLocation);

describe('가챠 검색 내비게이션', () => {
  it('카테고리로 찾은 가챠를 매장 수 순서로 보여주고 선택 결과로 이동한다', async () => {
    let requestedCategoryKeyword: string | null = null;
    let requestedCategoryIds: string | null = null;

    server.use(
      http.get('/api/v1/categories', ({ request }) => {
        requestedCategoryKeyword = new URL(request.url).searchParams.get(
          'keyword',
        );

        return HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: {
            items: [
              { categoryId: 17, name: '쿠로미' },
              { categoryId: 23, name: '쿠로미 피규어' },
            ],
          },
        });
      }),
      http.get('/api/v1/gachas', ({ request }) => {
        requestedCategoryIds = new URL(request.url).searchParams.get(
          'categoryIds',
        );

        return HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: {
            content: [
              {
                gachaId: 102,
                name: '쿠로미 랜덤 참',
                thumbnailUrl: null,
                categories: ['산리오', '쿠로미'],
                storeCount: 0,
              },
              {
                gachaId: 101,
                name: '쿠로미 미니 피규어 vol.2',
                thumbnailUrl: null,
                categories: ['산리오', '쿠로미'],
                storeCount: 4,
              },
            ],
            totalElements: 2,
          },
        });
      }),
    );
    const user = userEvent.setup();

    render(<GachaSearchNavigationBar />);
    await user.type(
      screen.getByRole('searchbox', { name: '가챠 검색어' }),
      '쿠로미',
    );
    await user.click(screen.getByRole('button', { name: '검색' }));

    const result = await screen.findByRole('button', {
      name: '쿠로미 미니 피규어 vol.2 선택, 4개 매장 보유중',
    });
    const unavailableResult = screen.getByRole('button', {
      name: '쿠로미 랜덤 참, 보유 매장 없음',
    });

    expect(requestedCategoryKeyword).toBe('쿠로미');
    expect(requestedCategoryIds).toBe('17,23');
    expect(unavailableResult).toBeDisabled();
    expect(
      screen
        .getAllByText(/개 매장 보유중/)
        .map((element) => element.textContent),
    ).toEqual(['4개 매장 보유중', '0개 매장 보유중']);

    await user.click(result);

    expect(mockedAssignBrowserLocation).toHaveBeenCalledWith(
      '/search?gachaId=101',
    );
  });
});
