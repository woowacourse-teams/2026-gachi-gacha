import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { TRADE_DETAIL } from './storybook/tradeDetailMocks';
import TradeDetailPage from './TradeDetailPage';
import { TRADE_ITEMS } from '../trade/storybook/tradeMocks';

const meta: Meta<typeof TradeDetailPage> = {
  title: 'routes/trade/TradeDetailPage',
  component: TradeDetailPage,
  args: {
    detail: TRADE_DETAIL,
    relatedItems: TRADE_ITEMS,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TradeDetailPage>;

export const Default: Story = {};
