import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TradeCreateFailurePage from './TradeCreateFailurePage';

const meta: Meta<typeof TradeCreateFailurePage> = {
  title: 'routes/tradeCreateFailure/TradeCreateFailurePage',
  component: TradeCreateFailurePage,
  args: {
    errorMessage: '사진 업로드 중 문제가 발생했습니다.',
    onRetry: () => undefined,
    onMoveToFeed: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TradeCreateFailurePage>;

export const Default: Story = {};
