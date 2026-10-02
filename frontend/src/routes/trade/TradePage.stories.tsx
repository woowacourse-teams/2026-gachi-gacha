import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

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
  // 게시글 카드와 글 등록 버튼이 Link라 라우터 안에서 렌더링해야 한다.
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/trade']}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TradePage>;

export const Default: Story = {};
