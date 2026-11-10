import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';
import { SiteFooter } from '@/shared/ui/SiteFooter';

import { TRADE_ITEMS } from './storybook/tradeMocks';
import TradePage from './TradePage';

const meta: Meta<typeof TradePage> = {
  title: 'routes/trade/TradePage',
  component: TradePage,
  args: {
    items: TRADE_ITEMS,
    selectedQuickKeyword: null,
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
        <SiteFooter />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TradePage>;

export const Default: Story = {
  args: { hasMore: true, onLoadMore: () => {} },
};

export const WebHomeAuthenticated: Story = {
  ...Default,
  render: (args) => (
    <MockWorkerBoundary handlers={[authenticatedMemberHandler]}>
      <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
        <TradePage {...args} />
      </AuthSessionProvider>
    </MockWorkerBoundary>
  ),
};

export const LongList: Story = {
  args: {
    items: Array.from({ length: 3 }, (_, groupIndex) =>
      TRADE_ITEMS.map((item) => ({
        ...item,
        tradeId: item.tradeId + groupIndex * TRADE_ITEMS.length,
      })),
    ).flat(),
  },
};

export const MobileHome: Story = {
  parameters: {
    viewport: {
      options: {
        tradeMobile: {
          name: 'Mobile 390px',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: {
    viewport: { value: 'tradeMobile', isRotated: false },
  },
};
