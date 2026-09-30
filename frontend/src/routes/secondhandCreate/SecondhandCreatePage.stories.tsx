import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';
import { tradeHandlers } from '@/routes/secondhand/mocks/tradeHandlers';

import SecondhandCreatePage from './SecondhandCreatePage';

function AuthenticatedCreateStory() {
  useEffect(() => {
    storeAuthTokens({
      accessToken: 'storybook-access-token',
      refreshToken: 'storybook-refresh-token',
    });

    return clearAuthTokens;
  }, []);

  return (
    <MemoryRouter initialEntries={['/used-market/new']}>
      <SecondhandCreatePage />
    </MemoryRouter>
  );
}

const meta: Meta<typeof SecondhandCreatePage> = {
  title: 'routes/secondhand/SecondhandCreatePage',
  component: SecondhandCreatePage,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <MockWorkerBoundary handlers={tradeHandlers}>
      <AuthenticatedCreateStory />
    </MockWorkerBoundary>
  ),
};

export default meta;

type Story = StoryObj<typeof SecondhandCreatePage>;

export const Default: Story = {};
