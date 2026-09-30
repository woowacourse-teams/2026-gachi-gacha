import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { TRADE_CREATED_TRADE } from './storybook/createdTradeMock';
import TradeCreateSuccessPage from './TradeCreateSuccessPage';

const meta: Meta<typeof TradeCreateSuccessPage> = {
  title: 'routes/trade/TradeCreateSuccessPage',
  component: TradeCreateSuccessPage,
  args: {
    trade: TRADE_CREATED_TRADE,
    onViewTrade: () => undefined,
    onMoveToFeed: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TradeCreateSuccessPage>;

export const Default: Story = {};
