import { afterEach, describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { NotificationProvider } from '@/features/notifications/NotificationContext';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { NotificationsRoute } from './route';

const NOTIFICATION = {
  notificationId: 101,
  type: 'COMMENT',
  title: '새 댓글이 달렸어요',
  body: '가챠친구: 주말에도 교환 가능하신가요?',
  tradeId: 7,
  commentId: 55,
  read: false,
  createdAt: new Date().toISOString(),
} as const;

function registerAuthenticatedMemberHandler() {
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
}

function prepareAuthenticatedSession() {
  storeAuthTokens({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });
  registerAuthenticatedMemberHandler();
}

describe('NotificationsRoute', () => {
  afterEach(() => {
    clearAuthTokens();
  });

  it('전체 댓글 알림을 표시하고 커서로 다음 페이지를 불러온다', async () => {
    const user = userEvent.setup();
    prepareAuthenticatedSession();
    server.use(
      http.get('/api/v1/notifications', ({ request }) => {
        const lastNotificationId = new URL(request.url).searchParams.get(
          'lastNotificationId',
        );

        if (lastNotificationId === '101') {
          return HttpResponse.json({
            code: 'C000',
            message: '정상',
            data: {
              notifications: [
                {
                  ...NOTIFICATION,
                  notificationId: 80,
                  title: '이전 댓글 알림',
                  read: true,
                },
              ],
              nextLastNotificationId: 80,
              hasNext: false,
            },
          });
        }

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            notifications: [NOTIFICATION],
            nextLastNotificationId: 101,
            hasNext: true,
          },
        });
      }),
    );

    renderWithProviders(<NotificationsRoute />, { route: '/notifications' });

    expect(
      await screen.findByRole('link', { name: /새 댓글이 달렸어요/ }),
    ).toHaveAttribute('href', '/trade/7');
    await user.click(screen.getByRole('button', { name: '알림 더보기' }));

    expect(await screen.findByText('이전 댓글 알림')).toBeInTheDocument();
  });

  it('모두 읽음 처리하면 안 읽은 표시를 제거한다', async () => {
    const user = userEvent.setup();
    prepareAuthenticatedSession();
    let readAllRequestCount = 0;
    server.use(
      http.get('/api/v1/notifications', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            notifications: [NOTIFICATION],
            nextLastNotificationId: 101,
            hasNext: false,
          },
        }),
      ),
      http.patch('/api/v1/notifications/read-all', () => {
        readAllRequestCount += 1;
        return HttpResponse.json({ code: 'C002', message: '수정 완료' });
      }),
    );

    renderWithProviders(<NotificationsRoute />, { route: '/notifications' });

    await user.click(await screen.findByRole('button', { name: '모두 읽음' }));

    await waitFor(() => {
      expect(readAllRequestCount).toBe(1);
      expect(screen.queryByText('1개 안 읽음')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '모두 읽음' })).toBeDisabled();
    });
  });

  it('서버의 전체 안 읽은 개수를 목록 계산값보다 우선한다', async () => {
    prepareAuthenticatedSession();
    server.use(
      http.get('/api/v1/notifications/unread-count', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { unreadCount: 30 },
        }),
      ),
      http.get('/api/v1/notifications', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            notifications: [{ ...NOTIFICATION, read: true }],
            nextLastNotificationId: 101,
            hasNext: true,
          },
        }),
      ),
    );

    renderWithProviders(
      <NotificationProvider>
        <NotificationsRoute />
      </NotificationProvider>,
      { route: '/notifications' },
    );

    expect(await screen.findByText('30개 안 읽음')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모두 읽음' })).toBeEnabled();
  });
});
