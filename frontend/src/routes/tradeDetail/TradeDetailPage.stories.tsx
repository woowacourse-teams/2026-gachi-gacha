import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

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

export const Guest: Story = {
  args: {
    commentViewer: null,
  },
};

export const EmptyComments: Story = {
  args: {
    comments: [],
    onSubmitComment: undefined,
    onCommentAction: undefined,
  },
};

export const ChiikawaAffiliateCatalog: Story = {
  args: {
    detail: {
      ...TRADE_DETAIL,
      title: '미개봉 치이카와 키링 교환해요',
      categories: ['치이카와', '키링'],
    },
  },
};

export const MobileDetail: Story = {
  parameters: {
    viewport: {
      options: {
        mobileDetail: {
          name: 'Mobile 390px',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: {
    viewport: { value: 'mobileDetail', isRotated: false },
  },
};

function OwnerDetailPreview(
  props: React.ComponentProps<typeof TradeDetailPage>,
) {
  const [status, setStatus] = useState<TradeStatus>(props.detail.status);

  return (
    <TradeDetailPage
      {...props}
      action="edit"
      detail={{ ...props.detail, status }}
      onChangeStatus={(nextStatus) => {
        setStatus(nextStatus);
        return Promise.resolve();
      }}
    />
  );
}

export const OwnerDetail: Story = {
  render: (args) => <OwnerDetailPreview {...args} />,
};

export const MobileOwnerDetail: Story = {
  ...MobileDetail,
  ...OwnerDetail,
};
