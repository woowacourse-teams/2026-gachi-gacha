import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandCreateSuccessPage from './SecondhandCreateSuccessPage';
import { SECONDHAND_CREATED_TRADE } from '../storybook/secondhandMocks';

const meta: Meta<typeof SecondhandCreateSuccessPage> = {
  title: 'routes/secondhand/SecondhandCreateSuccessPage',
  component: SecondhandCreateSuccessPage,
  args: {
    trade: SECONDHAND_CREATED_TRADE,
    onViewTrade: () => undefined,
    onMoveToFeed: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandCreateSuccessPage>;

export const Default: Story = {};
