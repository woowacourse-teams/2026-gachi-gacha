import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { OfflineBanner } from '@/shared/ui/OfflineBanner';

import { NotFoundRoute } from './route';

const meta = {
  title: 'Routes/NotFound',
  component: NotFoundRoute,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/unknown-page']}>
        <AuthSessionProvider initialAccessToken={null}>
          <OfflineBanner />
          <Story />
        </AuthSessionProvider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof NotFoundRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
