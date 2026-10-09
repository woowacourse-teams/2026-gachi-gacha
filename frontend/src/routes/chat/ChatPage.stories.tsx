import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChatPage from './ChatPage';
import { CHAT_CONVERSATIONS, SELECTED_CHAT_ROOM } from './storybook/chatMocks';

const meta: Meta<typeof ChatPage> = {
  title: 'routes/chat/ChatPage',
  component: ChatPage,
  args: {
    conversations: CHAT_CONVERSATIONS,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ChatPage>;

export const Empty: Story = {};

export const Selected: Story = {
  args: {
    selectedRoom: SELECTED_CHAT_ROOM,
    onTradeAction: async () => undefined,
  },
};

export const ReservedByOwner: Story = {
  args: {
    selectedRoom: {
      ...SELECTED_CHAT_ROOM,
      tradeStatus: 'IN_PROGRESS',
      tradeAction: 'CANCEL_RESERVATION',
    },
    onTradeAction: async () => undefined,
  },
};

export const ReservedByRequester: Story = {
  args: {
    selectedRoom: {
      ...SELECTED_CHAT_ROOM,
      tradeStatus: 'IN_PROGRESS',
      tradeAction: 'COMPLETE_TRADE',
    },
    onTradeAction: async () => undefined,
  },
};

export const ReservedInAnotherRoom: Story = {
  args: {
    selectedRoom: {
      ...SELECTED_CHAT_ROOM,
      tradeStatus: 'IN_PROGRESS',
      tradeAction: null,
    },
    onTradeAction: async () => undefined,
  },
};
