import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TradingToolbar from './TradingToolbar';

const meta: Meta<typeof TradingToolbar> = {
  title: 'routes/secondhand/TradingToolbar',
  component: TradingToolbar,
  args: {
    neighborhood: '신당동',
    address: '서울특별시 중구 신당동',
  },
};

export default meta;

type Story = StoryObj<typeof TradingToolbar>;

export const Default: Story = {};
