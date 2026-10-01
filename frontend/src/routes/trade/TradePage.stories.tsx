import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { TRADE_ITEMS } from './storybook/tradeMocks';
import TradePage from './TradePage';

const meta: Meta<typeof TradePage> = {
  title: 'routes/trade/TradePage',
  component: TradePage,
  args: {
    items: TRADE_ITEMS,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TradePage>;

export const Default: Story = {};
