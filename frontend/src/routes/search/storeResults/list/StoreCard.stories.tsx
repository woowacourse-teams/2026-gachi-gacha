import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { StoreCard, type StoreCardProps } from './StoreCard';

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
      <g fill="#ffffff" opacity="0.9">
        <circle cx="157" cy="207" r="31" />
        <circle cx="320" cy="207" r="31" />
        <circle cx="483" cy="207" r="31" />
      </g>
      <text x="320" y="365" text-anchor="middle" fill="#4b4547" font-size="30" font-family="sans-serif" font-weight="700">GACHA STORE</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function InteractiveStoreCard(props: StoreCardProps) {
  const [isSelected, setIsSelected] = useState(props.isSelected ?? false);

  return (
    <StoreCard
      {...props}
      isSelected={isSelected}
      onSelect={(storeId) => {
        setIsSelected(true);
        props.onSelect(storeId);
      }}
    />
  );
}

const meta = {
  title: 'Routes/Search/StoreCard',
  component: StoreCard,
  render: (args) => <InteractiveStoreCard {...args} />,
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
    store: {
      storeId: 1,
      name: '홍대 가챠 스테이션',
      thumbnailUrl: createThumbnail(),
      address: '서울 마포구 홍익로 1',
      latitude: 37.5559,
      longitude: 126.9238,
      distance: 120,
      gachaCount: 128,
    },
    onOpen: () => undefined,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof StoreCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    isSelected: true,
  },
};

export const WithoutThumbnail: Story = {
  args: {
    store: {
      storeId: 2,
      name: '연남 캡슐토이',
      thumbnailUrl: null,
      address: '서울 마포구 동교로 2',
      latitude: 37.5584,
      longitude: 126.9251,
      distance: 310,
      gachaCount: 64,
    },
  },
};

export const LongContent: Story = {
  args: {
    store: {
      storeId: 3,
      name: '홍대입구 가챠 캐릭터 캡슐토이 컬렉션 스테이션 플래그십 스토어',
      thumbnailUrl: createThumbnail(),
      address:
        '서울특별시 마포구 양화로 아주 긴 건물명 지하 2층 201호 가챠 전문 매장',
      latitude: 37.5502,
      longitude: 126.9145,
      distance: 1480,
      gachaCount: 92,
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
