import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';

import { PrivacyRoute } from './route';

const meta = {
  title: 'Routes/Privacy',
  component: PrivacyRoute,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/privacy']}>
        <AuthSessionProvider initialAccessToken={null}>
          <Story />
        </AuthSessionProvider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof PrivacyRoute>;

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
