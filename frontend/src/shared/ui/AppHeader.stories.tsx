import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
  expiredMemberHandler,
  loadingMemberHandler,
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
  args: {
    currentPath: '/search',
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

export const MapActive: Story = {};

export const HomeActive: Story = {
  args: {
    currentPath: '/',
  },
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

export const MobileGuest: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
