import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';
import { tradeHandlers } from '@/routes/trade/mocks/tradeHandlers';

import TradeCreatePage from './TradeCreatePage';

function AuthenticatedCreateStory() {
  useEffect(() => {
    storeAuthTokens({
      accessToken: 'storybook-access-token',
      refreshToken: 'storybook-refresh-token',
    });

    return clearAuthTokens;
  }, []);

  return (
    <MemoryRouter initialEntries={['/trade/new']}>
      <TradeCreatePage />
    </MemoryRouter>
  );
}

const meta: Meta<typeof TradeCreatePage> = {
  title: 'routes/trade/TradeCreatePage',
  component: TradeCreatePage,
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

type Story = StoryObj<typeof TradeCreatePage>;

export const Default: Story = {};
