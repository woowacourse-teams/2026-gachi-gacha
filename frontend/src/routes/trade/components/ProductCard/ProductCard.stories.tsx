import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import ProductCard from './ProductCard';
import { TRADE_ITEMS } from '../../storybook/tradeMocks';

const meta: Meta<typeof ProductCard> = {
  title: 'routes/trade/ProductCard',
  component: ProductCard,
  // 카드 전체가 상세 페이지 Link라 라우터 안에서 렌더링해야 한다.
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/trade']}>
        <div style={{ width: 280 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    item: TRADE_ITEMS[0]!,
  },
};

export default meta;

type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {};
