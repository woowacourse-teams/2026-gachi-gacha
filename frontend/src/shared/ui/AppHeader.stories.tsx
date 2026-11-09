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
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { AppHeader } from './AppHeader';
import { HeaderSearch } from './HeaderSearch';
import type { HeaderNotification } from './NotificationPopover';

const notificationFixtures = [
  {
    id: 'comment-1',
    type: 'comment',
    title: '새 댓글이 달렸어요',
    message: '가챠친구: 혹시 주말에도 교환 가능하신가요?',
    createdAtLabel: '방금 전',
    isRead: false,
    destination: '/trade/7',
  },
  {
    id: 'comment-2',
    type: 'comment',
    title: '새 댓글이 달렸어요',
    message: '우디: 홍대입구역에서 가능할까요?',
    createdAtLabel: '5분 전',
    isRead: true,
    destination: '/trade/99',
  },
] satisfies readonly HeaderNotification[];

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

export const DesktopRoutes: Story = {
  render: () => (
    <AuthSessionProvider initialAccessToken={null}>
      <div style={{ display: 'grid', gap: 24 }}>
        {['/trade', '/map', '/search', '/mypage', '/chat'].map((path) => (
          <section key={path} aria-label={path}>
            <p style={{ marginInline: 40 }}>{path}</p>
            <AppHeader currentPath={path} />
          </section>
        ))}
      </div>
    </AuthSessionProvider>
  ),
};

export const MobileHome: Story = {
  args: { currentPath: '/trade', showMobileTabs: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const MobileMap: Story = {
  args: { currentPath: '/map', showMobileTabs: true, mobileVariant: 'map' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
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

export const AuthenticatedWithUnreadChats: Story = {
  args: {
    chatUnreadCount: 12,
  },
  render: (args) => (
    <MockWorkerBoundary handlers={[authenticatedMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <AppHeader {...args} />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const MobileAuthenticatedWithUnreadChats: Story = {
  ...AuthenticatedWithUnreadChats,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const AuthenticatedWithNotifications: Story = {
  args: {
    notificationState: {
      status: 'success',
      data: notificationFixtures,
      errorMessage: null,
    },
  },
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

export const MobileSearch: Story = {
  args: {
    currentPath: '/search',
    mobileVariant: 'search',
    search: (
      <HeaderSearch
        keyword="치이카와"
        backTo="/trade"
        onSearch={() => undefined}
      />
    ),
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
