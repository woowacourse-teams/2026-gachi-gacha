import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { createStoreDetailMockResponse } from './mocks/storeDetailMock';
import { createStoreGachaMockResponse } from './mocks/storeGachaMock';
import { StoreDetailRoute } from './route';

const loadingHandler = http.get('/api/v1/stores/:storeId', async () => {
  await delay('infinite');

  return HttpResponse.json({});
});

const loadingHandlers = [loadingHandler] as const;

const meta = {
  title: 'Routes/Store Detail/StoreDetailRoute',
  component: StoreDetailRoute,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/stores/1']}>
        <Story />
      </MemoryRouter>
    ),
  ],
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

type Story = StoryObj<typeof StoreDetailRoute>;

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

export const SinglePhoto: Story = {
  render: (args) => (
    <MockWorkerBoundary
      handlers={[
        http.get('/api/v1/stores/1', () => {
          const response = createStoreDetailMockResponse(1)!;
          return HttpResponse.json({
            ...response,
            data: { ...response.data, images: [] },
          });
        }),
      ]}
    >
      <StoreDetailRoute {...args} />
    </MockWorkerBoundary>
  ),
};
export const CatalogError: Story = {
  render: (args) => (
    <MockWorkerBoundary
      handlers={[
        http.get('/api/v1/stores/1/gachas', () =>
          HttpResponse.json(
            { message: '매장 보유 가챠를 불러오지 못했습니다.' },
            { status: 500 },
          ),
        ),
      ]}
    >
      <StoreDetailRoute {...args} />
    </MockWorkerBoundary>
  ),
};
export const MobileSparseInformation: Story = {
  ...SparseInformation,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const MobileCatalogError: Story = {
  ...CatalogError,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const CatalogLoading: Story = {
  render: (args) => (
    <MockWorkerBoundary
      handlers={[
        http.get('/api/v1/stores/1/gachas', async () => {
          await delay('infinite');
          return HttpResponse.json({});
        }),
      ]}
    >
      <StoreDetailRoute {...args} />
    </MockWorkerBoundary>
  ),
};
export const LoadMoreError: Story = {
  render: (args) => (
    <MockWorkerBoundary
      handlers={[
        http.get('/api/v1/stores/1/gachas', ({ request }) =>
          new URL(request.url).searchParams.get('page') === '0'
            ? HttpResponse.json(createStoreGachaMockResponse(1, 0, 8))
            : HttpResponse.json(
                { message: '가챠를 더 불러오지 못했습니다.' },
                { status: 500 },
              ),
        ),
      ]}
    >
      <StoreDetailRoute {...args} />
    </MockWorkerBoundary>
  ),
};
