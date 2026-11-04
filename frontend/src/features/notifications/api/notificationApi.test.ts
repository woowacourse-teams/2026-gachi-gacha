import { afterEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationApi';

const TOKENS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('notificationApi', () => {
  afterEach(() => {
    clearAuthTokens();
  });

  it('최신 댓글 알림 목록을 조회한다', async () => {
    storeAuthTokens(TOKENS);
    server.use(
      http.get('/api/v1/notifications', ({ request }) => {
        expect(new URL(request.url).searchParams.get('size')).toBe('20');

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
                createdAt: '2026-10-21T13:00:00',
              },
            ],
            nextLastNotificationId: 101,
            hasNext: true,
          },
        });
      }),
    );

    await expect(getNotifications()).resolves.toEqual({
      notifications: [
        {
          notificationId: 101,
          type: 'COMMENT',
          title: '새 댓글이 달렸어요',
          body: '가챠친구: 주말에도 가능한가요?',
          tradeId: 7,
          commentId: 55,
          read: false,
          createdAt: '2026-10-21T13:00:00',
        },
      ],
      nextLastNotificationId: 101,
      hasNext: true,
    });
  });

  it('채팅 유형이 알림 목록에 오면 명세 오류로 처리한다', async () => {
    storeAuthTokens(TOKENS);
    server.use(
      http.get('/api/v1/notifications', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            notifications: [
              {
                notificationId: 1,
                type: 'CHAT',
                title: '채팅',
                body: '메시지',
                tradeId: 7,
                commentId: 55,
                read: false,
                createdAt: '2026-10-21T13:00:00',
              },
            ],
            nextLastNotificationId: 1,
            hasNext: false,
          },
        }),
      ),
    );

    await expect(getNotifications()).rejects.toThrow(
      '알림 응답 형식이 올바르지 않습니다.',
    );
  });

  it('읽지 않은 알림 개수를 조회하고 알림을 읽음 처리한다', async () => {
    storeAuthTokens(TOKENS);
    let requestedNotificationId = '';
    server.use(
      http.get('/api/v1/notifications/unread-count', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { unreadCount: 3 },
        }),
      ),
      http.patch('/api/v1/notifications/:notificationId/read', ({ params }) => {
        requestedNotificationId = String(params.notificationId);

        return HttpResponse.json({ code: 'C002', message: '수정 완료' });
      }),
    );

    await expect(getUnreadNotificationCount()).resolves.toBe(3);
    await expect(markNotificationRead('101')).resolves.toBeUndefined();
    expect(requestedNotificationId).toBe('101');
  });

  it('모든 알림을 읽음 처리한다', async () => {
    storeAuthTokens(TOKENS);
    let requestCount = 0;
    server.use(
      http.patch('/api/v1/notifications/read-all', () => {
        requestCount += 1;
        return HttpResponse.json({ code: 'C002', message: '수정 완료' });
      }),
    );

    await expect(markAllNotificationsRead()).resolves.toBeUndefined();
    expect(requestCount).toBe(1);
  });
});
