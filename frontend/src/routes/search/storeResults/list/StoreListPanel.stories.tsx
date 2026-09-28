import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { AsyncState } from '@/shared/hooks/asyncStateType';

import { StoreListPanel, type StoreListPanelProps } from './StoreListPanel';
import type { NearbyStoresResponseDto } from '../../api/nearbyStoresResponseType';
import { nearbyStoresMockResponse } from '../../mocks/nearbyStoresMock';

function createThumbnail(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <rect width="640" height="480" fill="#f7ecee" />
      <rect x="64" y="92" width="512" height="296" rx="28" fill="#ffffff" />
      <g fill="#d93b54">
        <rect x="106" y="142" width="102" height="174" rx="16" />
        <rect x="269" y="142" width="102" height="174" rx="16" />
        <rect x="432" y="142" width="102" height="174" rx="16" />
      </g>
      <text x="320" y="365" text-anchor="middle" fill="#4b4547" font-size="30" font-family="sans-serif" font-weight="700">GACHA STORE</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const successState = {
  status: 'success',
  data: {
    ...nearbyStoresMockResponse.data,
    stores: nearbyStoresMockResponse.data.stores.map((store, index) =>
      index === 0 ? { ...store, thumbnailUrl: createThumbnail() } : store,
    ),
  },
  errorMessage: null,
} satisfies AsyncState<NearbyStoresResponseDto>;

function InteractiveStoreListPanel(props: StoreListPanelProps) {
  const [selectedStoreId, setSelectedStoreId] = useState(props.selectedStoreId);
  const [storesState, setStoresState] = useState(props.storesState);

  return (
    <StoreListPanel
      {...props}
      storesState={storesState}
      selectedStoreId={selectedStoreId}
      onSelectStore={(storeId) => {
        setSelectedStoreId(storeId);
        props.onSelectStore(storeId);
      }}
      onRetry={() => {
        setStoresState({
          status: 'loading',
          data: null,
          errorMessage: null,
        });
        props.onRetry();
      }}
    />
  );
}

const meta = {
  title: 'Routes/Search/StoreListPanel',
  component: StoreListPanel,
  render: (args) => <InteractiveStoreListPanel {...args} />,
  decorators: [
    (Story) => (
      <div
        style={{
          width: 'min(640px, 100%)',
          margin: '0 auto',
          padding: '40px 20px',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    storesState: successState,
    selectedStoreId: null,
    onOpenStore: () => undefined,
    onSelectStore: () => undefined,
    onRetry: () => undefined,
  },
} satisfies Meta<typeof StoreListPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const SelectedStore: Story = {
  args: {
    selectedStoreId: 2,
  },
};

export const MobileCarousel: Story = {
  decorators: [
    (Story) => (
      <div style={{ margin: '-40px -20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Idle: Story = {
  args: {
    storesState: {
      status: 'idle',
      data: null,
      errorMessage: null,
    },
  },
};

export const Loading: Story = {
  args: {
    storesState: {
      status: 'loading',
      data: null,
      errorMessage: null,
    },
  },
};

export const Empty: Story = {
  args: {
    storesState: {
      status: 'success',
      data: {
        ...nearbyStoresMockResponse.data,
        stores: [],
      },
      errorMessage: null,
    },
  },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    storesState: {
      status: 'error',
      data: null,
      errorMessage: '매장 목록을 불러오지 못했습니다.',
    },
  },
};
