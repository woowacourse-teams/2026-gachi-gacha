import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { COMMENT_VIEWER, TRADE_COMMENTS } from './storybook/tradeCommentMocks';
import { TRADE_DETAIL } from './storybook/tradeDetailMocks';
import TradeDetailPage from './TradeDetailPage';
import { TRADE_ITEMS } from '../trade/storybook/tradeMocks';

const meta: Meta<typeof TradeDetailPage> = {
  title: 'routes/trade/TradeDetailPage',
  component: TradeDetailPage,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    detail: TRADE_DETAIL,
    relatedItems: TRADE_ITEMS,
    comments: TRADE_COMMENTS,
    commentViewer: COMMENT_VIEWER,
    onSubmitComment: () => undefined,
    onCommentAction: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TradeDetailPage>;

export const Default: Story = {};

export const EmptyComments: Story = {
  args: {
    comments: [],
    onSubmitComment: undefined,
    onCommentAction: undefined,
  },
};
