import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandDetailPage from './SecondhandDetailPage';
import {
  SECONDHAND_DETAIL,
  SECONDHAND_ITEMS,
  SECONDHAND_CHAT_ROOM,
} from './storybook/secondhandMocks';

const meta: Meta<typeof SecondhandDetailPage> = {
  title: 'routes/secondhand/SecondhandDetailPage',
  component: SecondhandDetailPage,
  args: {
    detail: SECONDHAND_DETAIL,
    relatedItems: SECONDHAND_ITEMS,
    chatRoom: SECONDHAND_CHAT_ROOM,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandDetailPage>;

export const Default: Story = {};

export const ChatOpen: Story = {
  args: {
    initialChatOpen: true,
  },
};
