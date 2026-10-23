import { type ReactNode, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

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

import { MyTradesRoute } from './route';
import {
  emptyMyTradesHandler,
  myTradesHandler,
  tradeDeleteSuccessHandler,
} from '../mocks/myPageHandlers';

function AuthenticatedStory({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, '', '/mypage/trades');
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
    setIsReady(true);

    return () => clearAuthTokens();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
      {children}
    </AuthSessionProvider>
  );
}

const meta = {
  title: 'Routes/MyPage/MyTrades',
  component: MyTradesRoute,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <MockWorkerBoundary
      handlers={[
        authenticatedMemberHandler,
        myTradesHandler,
        tradeDeleteSuccessHandler,
      ]}
    >
      <AuthenticatedStory>
        <MyTradesRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
} satisfies Meta<typeof MyTradesRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Empty: Story = {
  render: () => (
    <MockWorkerBoundary
      handlers={[authenticatedMemberHandler, emptyMyTradesHandler]}
    >
      <AuthenticatedStory>
        <MyTradesRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
};
