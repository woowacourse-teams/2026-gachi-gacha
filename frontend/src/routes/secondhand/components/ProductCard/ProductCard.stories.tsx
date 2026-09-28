import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ProductCard from './ProductCard';
import { SECONDHAND_ITEMS } from '../../storybook/secondhandMocks';

const meta: Meta<typeof ProductCard> = {
  title: 'routes/secondhand/ProductCard',
  component: ProductCard,
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    item: SECONDHAND_ITEMS[0]!,
  },
};

export default meta;

type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {};
