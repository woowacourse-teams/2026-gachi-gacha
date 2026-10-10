import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import {
  AUTH_STORY_EXPIRED_TOKEN,
  AUTH_STORY_REFRESH_TOKEN,
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
  expiredMemberHandler,
  loadingMemberHandler,
  refreshingSessionHandlers,
} from '@/features/auth/mocks/authHandlers';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { AppHeader } from './AppHeader';

const meta = {
  title: 'Shared/UI/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/map']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    currentPath: '/map',
    search: <GachaSearchBar onSelect={() => undefined} />,
  },
  render: (args) => (
    <AuthSessionProvider initialAccessToken={null}>
      <AppHeader {...args} />
    </AuthSessionProvider>
  ),
} satisfies Meta<typeof AppHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

function RefreshingSessionStory({ args }: { args: Story['args'] }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_EXPIRED_TOKEN,
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
    <MockWorkerBoundary handlers={refreshingSessionHandlers}>
      <AuthSessionProvider>
        <AppHeader
          currentPath={args?.currentPath ?? '/map'}
          search={args?.search}
        />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  );
}

export const MapActive: Story = {};

export const SearchActive: Story = {
  args: {
    currentPath: '/search',
    search: undefined,
  },
};

export const StableNavigationWithSearchSlot: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <AppHeader currentPath="/trade" />
      <AppHeader
        currentPath="/map"
        search={<GachaSearchBar onSelect={() => undefined} />}
      />
    </div>
  ),
};

export const Authenticated: Story = {
  render: (args) => (
    <MockWorkerBoundary handlers={[authenticatedMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <AppHeader {...args} />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const CheckingSession: Story = {
  render: (args) => (
    <MockWorkerBoundary handlers={[loadingMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <AppHeader {...args} />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const ExpiredSession: Story = {
  render: (args) => (
    <MockWorkerBoundary handlers={[expiredMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <AppHeader {...args} />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const RefreshedSession: Story = {
  render: (args) => <RefreshingSessionStory args={args} />,
};

export const MobileGuest: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
