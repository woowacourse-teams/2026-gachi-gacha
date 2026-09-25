import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { StoreDetailOverview } from './StoreDetailOverview';
import { createStoreDetailMockResponse } from '../mocks/storeDetailMock';

const richStoreResponse = createStoreDetailMockResponse(1);
const sparseStoreResponse = createStoreDetailMockResponse(2);

if (!richStoreResponse || !sparseStoreResponse) {
  throw new Error('매장 상세 Storybook 목 데이터를 찾을 수 없습니다.');
}

const meta = {
  title: 'Store Detail/StoreDetailOverview',
  component: StoreDetailOverview,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof StoreDetailOverview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPhotos: Story = {
  args: {
    store: richStoreResponse.data,
  },
};

export const WithoutPhotos: Story = {
  args: {
    store: sparseStoreResponse.data,
  },
};
