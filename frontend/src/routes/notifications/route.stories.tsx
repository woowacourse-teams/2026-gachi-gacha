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
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { NotificationsRoute } from './route';

const notificationHandlers = [
  authenticatedMemberHandler,
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
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
          {
            notificationId: 98,
            type: 'COMMENT',
            title: '새 댓글이 달렸어요',
            body: '우디: 홍대입구역에서 교환하고 싶어요.',
            tradeId: 12,
            commentId: 48,
            read: true,
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
        ],
        nextLastNotificationId: 98,
        hasNext: false,
      },
    }),
  ),
  http.patch('/api/v1/notifications/read-all', () =>
    HttpResponse.json({ code: 'C002', message: '수정 완료' }),
  ),
];

function NotificationsStoryPage() {
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
    <MockWorkerBoundary handlers={notificationHandlers}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <NotificationsRoute />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  );
}

const meta = {
  title: 'Routes/Notifications',
  component: NotificationsRoute,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/notifications']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => <NotificationsStoryPage />,
} satisfies Meta<typeof NotificationsRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
