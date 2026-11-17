import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { submitSearchForm } from '@/test/submitSearchForm';

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
  it('비로그인 상태에서는 홈·지도 메뉴와 통합 검색·글쓰기 진입을 제공한다', () => {
    renderWithProviders(<AppHeader currentPath="/trade" />, {
      initialAccessToken: null,
    });

    const primaryNavigation = screen.getByRole('navigation', {
      name: '주요 메뉴',
    });

    expect(primaryNavigation).toHaveTextContent('홈지도');
    const homeLink = screen.getByRole('link', { name: '홈' });

    expect(homeLink).toHaveAttribute('href', '/trade');
    expect(homeLink).toHaveAttribute('aria-current', 'page');
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

  it('공통 검색창에서 공백을 정리해 통합 검색 결과로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppHeader currentPath="/mypage" />, {
      route: '/mypage',
    });
    await user.type(
      screen.getByRole('searchbox', { name: '검색어' }),
      '  치이카와  ',
    );
    submitSearchForm(
      screen.getByRole('search', { name: '통합 검색' }) as HTMLFormElement,
    );
    expect(window.location.pathname).toBe('/search');
    expect(new URLSearchParams(window.location.search).get('keyword')).toBe(
      '치이카와',
    );
  });

  it('검색어 지우기는 현재 화면에서 입력만 비운다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppHeader currentPath="/mypage" />, {
      route: '/mypage',
    });
    const input = screen.getByRole('searchbox', { name: '검색어' });
    await user.type(input, '치이카와');
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(input).toHaveValue('');
    expect(window.location.pathname).toBe('/mypage');
  });

  it('모바일 검색 진입과 글쓰기는 각 화면의 공통 경로를 사용한다', () => {
    renderWithProviders(<AppHeader currentPath="/trade" showMobileTabs />);
    expect(screen.getByLabelText('통합 검색으로 이동')).toHaveAttribute(
      'href',
      '/search',
    );
    expect(screen.getByRole('link', { name: '교환 글쓰기' })).toHaveAttribute(
      'href',
      '/trade/new',
    );
  });

  it('지도 검색은 가챠 탭과 지도 복귀 상태를 유지한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppHeader currentPath="/map" mobileVariant="map" showMobileTabs />,
      { route: '/map' },
    );
    await user.click(screen.getByText('교환글, 가챠, 매장 검색'));
    expect(window.location.pathname).toBe('/search');
    expect(window.location.search).toBe('?tab=gacha');
    expect(window.history.state?.usr).toEqual({ searchFrom: '/map' });
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

  it('읽지 않은 채팅 메시지 수를 채팅 아이콘 배지에 표시한다', async () => {
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
      <AppHeader currentPath="/trade" chatUnreadCount={120} />,
      { initialAccessToken: 'access-token' },
    );

    const chatLink = await screen.findByRole('link', {
      name: '채팅, 읽지 않은 메시지 120개',
    });

    expect(chatLink).toHaveAttribute('href', '/chat');
    expect(chatLink).toHaveTextContent('99+');
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
