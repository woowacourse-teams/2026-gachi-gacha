import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { Mobile as MobileForm } from '@/routes/tradeCreate/TradeCreatePage.stories';
import { TRADE_DETAIL } from '@/routes/tradeDetail/storybook/tradeDetailMocks';

import TradeEditPage from './TradeEditPage';

const meta: Meta<typeof TradeEditPage> = {
  title: 'routes/trade/TradeEditPage',
  component: TradeEditPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`/trade/${TRADE_DETAIL.tradeId}/edit`]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    detail: TRADE_DETAIL,
    categories: [{ categoryId: 1, name: '산리오' }],
  },
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof TradeEditPage>;

export const Default: Story = {};
export const Mobile: Story = {
  parameters: MobileForm.parameters,
  globals: MobileForm.globals,
};
