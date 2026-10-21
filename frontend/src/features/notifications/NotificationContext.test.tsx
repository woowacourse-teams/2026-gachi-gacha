import { StrictMode } from 'react';
import { afterEach, describe, expect, it } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { AppHeader } from '@/shared/ui/AppHeader';
import { server } from '@/test/server';

import { NotificationProvider } from './NotificationContext';

function useAuthenticatedMemberHandler() {
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

describe('NotificationProvider', () => {
  afterEach(() => {
    clearAuthTokens();
  });

  it('배지를 조회하고 팝오버를 열 때 댓글 알림을 불러온다', async () => {
    const user = userEvent.setup();
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    useAuthenticatedMemberHandler();
    let notificationListRequestCount = 0;
    server.use(
      http.get('/api/v1/notifications/unread-count', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { unreadCount: 1 },
        }),
      ),
      http.get('/api/v1/notifications', () => {
        notificationListRequestCount += 1;

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            notifications: [
              {
                notificationId: 101,
                type: 'COMMENT',
                title: '새 댓글이 달렸어요',
                body: '가챠친구: 주말에도 가능한가요?',
                tradeId: 7,
                commentId: 55,
                read: false,
                createdAt: new Date().toISOString(),
              },
            ],
            nextLastNotificationId: 101,
            hasNext: false,
          },
        });
      }),
    );

    render(
      <StrictMode>
        <BrowserRouter>
          <AuthSessionProvider>
            <NotificationProvider>
              <AppHeader currentPath="/trade" />
            </NotificationProvider>
          </AuthSessionProvider>
        </BrowserRouter>
      </StrictMode>,
    );

    const notificationButton = await screen.findByRole('button', {
      name: '알림, 읽지 않은 알림 1개',
    });
    await user.click(notificationButton);

    expect(
      await screen.findByRole('link', { name: /새 댓글이 달렸어요/ }),
    ).toHaveAttribute('href', '/trade/7');
    expect(
      screen.getByText('가챠친구: 주말에도 가능한가요?'),
    ).toBeInTheDocument();
    expect(notificationListRequestCount).toBe(1);
  });

  it('알림을 선택하면 읽음 처리한 뒤 안 읽은 개수를 다시 조회한다', async () => {
    const user = userEvent.setup();
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    useAuthenticatedMemberHandler();
    let unreadRequestCount = 0;
    let readNotificationId = '';
    server.use(
      http.get('/api/v1/notifications/unread-count', () => {
        unreadRequestCount += 1;

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { unreadCount: unreadRequestCount === 1 ? 1 : 0 },
        });
      }),
      http.get('/api/v1/notifications', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            notifications: [
              {
                notificationId: 101,
                type: 'COMMENT',
                title: '새 댓글이 달렸어요',
                body: '가챠친구: 주말에도 가능한가요?',
                tradeId: 7,
                commentId: 55,
                read: false,
                createdAt: new Date().toISOString(),
              },
            ],
            nextLastNotificationId: 101,
            hasNext: false,
          },
        }),
      ),
      http.patch('/api/v1/notifications/:notificationId/read', ({ params }) => {
        readNotificationId = String(params.notificationId);
        return HttpResponse.json({ code: 'C002', message: '수정 완료' });
      }),
    );

    render(
      <BrowserRouter>
        <AuthSessionProvider>
          <NotificationProvider>
            <AppHeader currentPath="/trade" />
          </NotificationProvider>
        </AuthSessionProvider>
      </BrowserRouter>,
    );

    await user.click(
      await screen.findByRole('button', {
        name: '알림, 읽지 않은 알림 1개',
      }),
    );
    await user.click(
      await screen.findByRole('link', { name: /새 댓글이 달렸어요/ }),
    );

    await waitFor(() => {
      expect(readNotificationId).toBe('101');
      expect(unreadRequestCount).toBe(2);
    });
  });
});
