import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import {
  AUTH_STORY_REFRESH_TOKEN,
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import { NotificationProvider } from '@/features/notifications/NotificationContext';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import HomePage from './HomePage';

const meta: Meta<typeof HomePage> = {
  title: 'routes/home/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof HomePage>;

export const Default: Story = {};

const homeNotificationHandlers = [
  authenticatedMemberHandler,
  http.get('/api/v1/notifications/unread-count', () =>
    HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: { unreadCount: 1 },
    }),
  ),
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
            body: '가챠친구: 혹시 주말에도 교환 가능하신가요?',
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
  http.get('/api/v1/categories', () =>
    HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: { items: [{ categoryId: 110, name: '산리오' }] },
    }),
  ),
  http.get('/api/v1/gachas', () =>
    HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        content: [
          {
            gachaId: 1,
            name: '산리오 캐릭터즈 미니 피규어',
            thumbnailUrl: null,
            categories: ['산리오'],
            storeCount: 3,
          },
        ],
        totalElements: 1,
      },
    }),
  ),
];

function AuthenticatedHomePage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
    setIsReady(true);

    return () => {
      clearAuthTokens();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <MemoryRouter initialEntries={['/']}>
      <MockWorkerBoundary handlers={homeNotificationHandlers}>
        <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
          <NotificationProvider>
            <HomePage />
          </NotificationProvider>
        </AuthSessionProvider>
      </MockWorkerBoundary>
    </MemoryRouter>
  );
}

export const AuthenticatedWithNotifications: Story = {
  render: () => <AuthenticatedHomePage />,
};
