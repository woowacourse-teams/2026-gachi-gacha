import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  appleLoginPreparationHandler,
  AUTH_STORY_TOKEN,
  failedMemberHandler,
  loadingMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { LoginRoute } from './route';

const storybookAppleId: AppleIdClient = {
  auth: {
    init: () => undefined,
    signIn: () =>
      Promise.reject(
        new Error('Storybook에서는 Apple 인증을 실행하지 않아요.'),
      ),
  },
};

const meta = {
  title: 'Routes/Login',
  component: LoginRoute,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      window.AppleID = storybookAppleId;

      return (
        <MockWorkerBoundary handlers={[appleLoginPreparationHandler]}>
          <Story />
        </MockWorkerBoundary>
      );
    },
  ],
  render: () => (
    <AuthSessionProvider initialAccessToken={null}>
      <LoginRoute />
    </AuthSessionProvider>
  ),
} satisfies Meta<typeof LoginRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {};

export const CheckingSession: Story = {
  render: () => (
    <MockWorkerBoundary handlers={[loadingMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <LoginRoute />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const SessionCheckFailed: Story = {
  render: () => (
    <MockWorkerBoundary handlers={[failedMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <LoginRoute />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TallDesktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktopTall',
      options: {
        desktopTall: {
          name: 'Desktop 1440 × 1280',
          styles: {
            width: '1440px',
            height: '1280px',
          },
        },
      },
    },
  },
};
