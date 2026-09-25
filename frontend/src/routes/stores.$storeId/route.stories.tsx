import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { delay, http, HttpResponse } from 'msw';

import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { StoreDetailRoute } from './route';

const loadingHandler = http.get('/api/v1/stores/:storeId', async () => {
  await delay('infinite');

  return HttpResponse.json({});
});

const loadingHandlers = [loadingHandler] as const;

const meta = {
  title: 'Routes/Store Detail/StoreDetailRoute',
  component: StoreDetailRoute,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <MockWorkerBoundary>
      <StoreDetailRoute {...args} />
    </MockWorkerBoundary>
  ),
  args: {
    pathname: '/stores/1',
  },
} satisfies Meta<typeof StoreDetailRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const SparseInformation: Story = {
  args: {
    pathname: '/stores/2',
  },
};

export const Loading: Story = {
  render: (args) => (
    <MockWorkerBoundary handlers={loadingHandlers}>
      <StoreDetailRoute {...args} />
    </MockWorkerBoundary>
  ),
};

export const NotFound: Story = {
  args: {
    pathname: '/stores/99',
  },
};

export const InvalidAddress: Story = {
  args: {
    pathname: '/stores/invalid',
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
