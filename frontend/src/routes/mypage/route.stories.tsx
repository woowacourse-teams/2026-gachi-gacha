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

import {
  emptyMyTradesHandler,
  failedMyTradesHandler,
  loadingMyTradesHandler,
  memberDeleteFailureHandler,
  memberDeleteSuccessHandler,
  memberUpdateFailureHandler,
  memberUpdateSuccessHandler,
  myTradesHandler,
} from './mocks/myPageHandlers';
import { MyPageRoute } from './route';

function AuthenticatedStory({ children }: { children: ReactNode }) {
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
    <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
      {children}
    </AuthSessionProvider>
  );
}

const meta = {
  title: 'Routes/MyPage',
  component: MyPageRoute,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <MockWorkerBoundary
      handlers={[
        authenticatedMemberHandler,
        myTradesHandler,
        memberUpdateSuccessHandler,
        memberDeleteSuccessHandler,
      ]}
    >
      <AuthenticatedStory>
        <MyPageRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
} satisfies Meta<typeof MyPageRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
      options: {
        tablet: {
          name: 'Tablet 900 × 1024',
          styles: { width: '900px', height: '1024px' },
        },
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const EmptyActivities: Story = {
  render: () => (
    <MockWorkerBoundary
      handlers={[authenticatedMemberHandler, emptyMyTradesHandler]}
    >
      <AuthenticatedStory>
        <MyPageRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
};

export const LoadingActivities: Story = {
  render: () => (
    <MockWorkerBoundary
      handlers={[authenticatedMemberHandler, loadingMyTradesHandler]}
    >
      <AuthenticatedStory>
        <MyPageRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
};

export const FailedActivities: Story = {
  render: () => (
    <MockWorkerBoundary
      handlers={[authenticatedMemberHandler, failedMyTradesHandler]}
    >
      <AuthenticatedStory>
        <MyPageRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
};

export const FailedProfileUpdate: Story = {
  render: () => (
    <MockWorkerBoundary
      handlers={[
        authenticatedMemberHandler,
        myTradesHandler,
        memberUpdateFailureHandler,
        memberDeleteSuccessHandler,
      ]}
    >
      <AuthenticatedStory>
        <MyPageRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
};

export const FailedAccountDeletion: Story = {
  render: () => (
    <MockWorkerBoundary
      handlers={[
        authenticatedMemberHandler,
        myTradesHandler,
        memberUpdateSuccessHandler,
        memberDeleteFailureHandler,
      ]}
    >
      <AuthenticatedStory>
        <MyPageRoute />
      </AuthenticatedStory>
    </MockWorkerBoundary>
  ),
};
