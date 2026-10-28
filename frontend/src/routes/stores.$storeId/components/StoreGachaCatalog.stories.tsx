import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { delay, http, HttpResponse } from 'msw';

import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { StoreGachaCatalog } from './StoreGachaCatalog';

const loadingHandler = http.get('/api/v1/stores/:storeId/gachas', async () => {
  await delay('infinite');

  return HttpResponse.json({});
});

const loadingHandlers = [loadingHandler] as const;

const meta = {
  title: 'Store Detail/StoreGachaCatalog',
  component: StoreGachaCatalog,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(1200px, calc(100% - 32px))', margin: 'auto' }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <MockWorkerBoundary>
      <StoreGachaCatalog {...args} />
    </MockWorkerBoundary>
  ),
  args: {
    storeId: 1,
  },
} satisfies Meta<typeof StoreGachaCatalog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Empty: Story = {
  args: {
    storeId: 2,
  },
};

export const Error: Story = {
  args: {
    storeId: 99,
  },
};

export const Loading: Story = {
  render: (args) => (
    <MockWorkerBoundary handlers={loadingHandlers}>
      <StoreGachaCatalog {...args} />
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
