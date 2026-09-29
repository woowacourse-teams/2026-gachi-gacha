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
  it('검색 결과를 선택하면 해당 가챠의 검색 페이지로 이동한다', async () => {
    let requestedKeyword: string | null = null;

    server.use(
      http.get('/api/v1/gachas', ({ request }) => {
        requestedKeyword = new URL(request.url).searchParams.get('keyword');

        return HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: {
            content: [
              {
                gachaId: 101,
                name: '쿠로미 미니 피규어 vol.2',
                thumbnailUrl: null,
                categories: ['산리오', '쿠로미'],
              },
            ],
            totalElements: 1,
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
      name: '쿠로미 미니 피규어 vol.2 선택',
    });

    expect(requestedKeyword).toBe('쿠로미');

    await user.click(result);

    expect(mockedAssignBrowserLocation).toHaveBeenCalledWith(
      '/search?gachaId=101',
    );
  });
});
