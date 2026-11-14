import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChatPage from './ChatPage';
import { CHAT_CONVERSATIONS, SELECTED_CHAT_ROOM } from './storybook/chatMocks';

const meta: Meta<typeof ChatPage> = {
  title: 'routes/chat/ChatPage',
  component: ChatPage,
  args: {
    conversations: CHAT_CONVERSATIONS,
    onChangeTradeStatus: async () => undefined,
    onSendMessage: async () => undefined,
    onSendImages: async () => undefined,
    socketStatus: 'connected',
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
  },
};

export const BuyerSelected: Story = {
  args: {
    selectedRoom: { ...SELECTED_CHAT_ROOM, isTradeOwner: false },
  },
};

export const OwnerInProgress: Story = {
  args: {
    selectedRoom: { ...SELECTED_CHAT_ROOM, tradeStatus: 'IN_PROGRESS' },
  },
};
