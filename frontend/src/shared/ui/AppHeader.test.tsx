import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { AppHeader } from './AppHeader';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
  syncAnalyticsUser: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

beforeEach(() => {
  mockedCaptureAnalyticsEvent.mockReset();
});

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
      screen.queryByRole('button', { name: '알림' }),
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

  it('검색창 유무와 무관하게 동일한 헤더 그리드 슬롯을 유지한다', () => {
    renderWithProviders(
      <>
        <AppHeader currentPath="/trade" />
        <AppHeader
          currentPath="/map"
          search={<form aria-label="가챠 검색" />}
        />
      </>,
      {
        initialAccessToken: null,
      },
    );
    const navigations = screen.getAllByRole('navigation', {
      name: '주요 메뉴',
    });
    const searchSlots = document.querySelectorAll('[data-header-search-slot]');

    expect(searchSlots).toHaveLength(2);
    expect(searchSlots[0]?.nextElementSibling).toBe(navigations[0]);
    expect(searchSlots[1]).toContainElement(
      screen.getByRole('form', { name: '가챠 검색' }),
    );
    expect(searchSlots[1]?.nextElementSibling).toBe(navigations[1]);
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
    expect(screen.getByRole('button', { name: '알림' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(
      screen.queryByRole('link', { name: '로그인' }),
    ).not.toBeInTheDocument();
  });

  it('알림 아이콘을 누르면 팝오버를 열고 다시 누르면 닫는다', async () => {
    const user = userEvent.setup();

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

    renderWithProviders(
      <AppHeader
        currentPath="/trade"
        notificationState={{
          status: 'success',
          data: [
            {
              id: 'comment-1',
              type: 'comment',
              title: '새 댓글이 달렸어요',
              message: '가챠친구: 교환이 가능한지 물어봤어요.',
              createdAtLabel: '방금 전',
              isRead: false,
              destination: '/trade/7',
            },
          ],
          errorMessage: null,
        }}
      />,
      { initialAccessToken: 'access-token' },
    );

    const notificationButton = await screen.findByRole('button', {
      name: '알림, 읽지 않은 알림 1개',
    });

    await user.click(notificationButton);

    expect(screen.getByRole('dialog', { name: '알림' })).toBeInTheDocument();
    expect(notificationButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(notificationButton);

    expect(
      screen.queryByRole('dialog', { name: '알림' }),
    ).not.toBeInTheDocument();
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'notification_popover_opened',
      { unread_count: 1 },
    );
  });

  it('Escape로 팝오버를 닫으면 알림 버튼으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();

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

    const notificationButton = await screen.findByRole('button', {
      name: '알림',
    });
    await user.click(notificationButton);
    await user.tab();
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: '알림' }),
    ).not.toBeInTheDocument();
    expect(notificationButton).toHaveFocus();
  });
});
