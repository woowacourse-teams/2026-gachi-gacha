import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('비로그인 상태에서는 거래/교환, 지도, 검색, 로그인만 노출한다', () => {
    renderWithProviders(<AppHeader currentPath="/trade" />, {
      initialAccessToken: null,
    });

    const primaryNavigation = screen.getByRole('navigation', {
      name: '주요 메뉴',
    });

    expect(primaryNavigation).toHaveTextContent('거래/교환지도검색');
    expect(screen.queryByRole('link', { name: '홈' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '채팅' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '알림' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
  });

  it('주요 메뉴는 문서 새로고침 없이 React Router 경로를 전환한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<AppHeader currentPath="/trade" />, {
      initialAccessToken: null,
      route: '/trade',
    });

    await user.click(screen.getByRole('link', { name: '지도' }));

    expect(window.location.pathname).toBe('/map');
  });

  it('로그인 상태에서는 채팅과 알림을 함께 노출한다', async () => {
    server.use(
      http.get('/api/v1/members/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            name: '김민지',
            nickname: '가챠러 민지',
            profileImageUrl: null,
            desireTradeLocation: null,
          },
        }),
      ),
    );

    renderWithProviders(<AppHeader currentPath="/trade" />, {
      initialAccessToken: 'access-token',
    });

    expect(await screen.findByRole('link', { name: '채팅' })).toHaveAttribute(
      'href',
      '/chat',
    );
    expect(screen.getByRole('link', { name: '알림' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(
      screen.queryByRole('link', { name: '로그인' }),
    ).not.toBeInTheDocument();
  });
});
