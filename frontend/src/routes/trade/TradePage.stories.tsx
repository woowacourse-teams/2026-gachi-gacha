import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { TRADE_ITEMS } from './storybook/tradeMocks';
import TradePage from './TradePage';

const meta: Meta<typeof TradePage> = {
  title: 'routes/trade/TradePage',
  component: TradePage,
  args: {
    items: TRADE_ITEMS,
    categories: [
      { categoryId: 1, name: '산리오' },
      { categoryId: 6, name: '치이카와' },
      { categoryId: 5, name: '포켓몬' },
      { categoryId: 7, name: '짱구' },
      { categoryId: 8, name: '디즈니' },
    ],
    categoryStatus: 'success',
    selectedCategoryId: null,
    statusFilter: null,
    sortOrder: 'latest',
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
