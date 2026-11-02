import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

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
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChatPage>;

export const Empty: Story = {};

export const Selected: Story = {
  args: {
    selectedRoom: SELECTED_CHAT_ROOM,
  },
};

export const MobileSelected: Story = {
  ...Selected,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileLongHeader: Story = {
  args: {
    selectedRoom: {
      ...SELECTED_CHAT_ROOM,
      partnerName: '아주긴닉네임의가챠수집가',
      itemTitle: '쿠로미와 마이멜로디 한정판 미니 피규어 세트 교환',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const SelectedSplit: Story = {
  args: {
    selectedRoom: SELECTED_CHAT_ROOM,
    presentation: 'split',
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
