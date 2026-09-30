import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ProductCard from './ProductCard';
import { TRADE_ITEMS } from '../../storybook/tradeMocks';

const meta: Meta<typeof ProductCard> = {
  title: 'routes/trade/ProductCard',
  component: ProductCard,
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    item: TRADE_ITEMS[0]!,
  },
};

export default meta;

type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {};
