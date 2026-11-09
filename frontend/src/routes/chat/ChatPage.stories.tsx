import { type ComponentProps, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

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
      <MockWorkerBoundary handlers={[authenticatedMemberHandler]}>
        <AuthSessionProvider initialAccessToken={AUTH_STORY_TOKEN}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </AuthSessionProvider>
      </MockWorkerBoundary>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChatPage>;

function InteractiveList(args: ComponentProps<typeof ChatPage>) {
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const conversation = args.conversations.find(
    (room) => room.id === selectedId,
  );
  const selectedRoom = conversation
    ? {
        ...SELECTED_CHAT_ROOM,
        conversationId: conversation.id,
        partnerName: conversation.partnerName,
        itemTitle: conversation.itemTitle,
        itemImageUrl: conversation.itemImageUrl,
        partnerProfileImageUrl: conversation.partnerProfileImageUrl,
        tradeStatus: conversation.status,
      }
    : undefined;
  return (
    <ChatPage
      {...args}
      presentation="split"
      selectedRoom={selectedRoom}
      onSelectConversation={(id) => setSelectedId(id ?? undefined)}
    />
  );
}

export const List: Story = { render: (args) => <InteractiveList {...args} /> };
export const Empty: Story = {
  args: { conversations: [], presentation: 'split' },
};
export const Loading: Story = {
  args: { conversations: [], listStatus: 'loading', presentation: 'split' },
};
export const Error: Story = {
  args: {
    conversations: [],
    listStatus: 'error',
    listErrorMessage: '채팅 목록을 불러오지 못했습니다.',
    onRetryList: () => undefined,
    presentation: 'split',
  },
};
export const MobileList: Story = {
  ...List,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const MobileEmpty: Story = {
  ...Empty,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const MobileLoading: Story = {
  ...Loading,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const MobileError: Story = {
  ...Error,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const LongList: Story = {
  ...List,
  args: {
    conversations: Array.from({ length: 24 }, (_, index) => ({
      ...CHAT_CONVERSATIONS[index % CHAT_CONVERSATIONS.length]!,
      id: index + 1,
      partnerName:
        index === 0
          ? '아주긴닉네임을사용하는가챠교환상대방'
          : `가챠 친구 ${index + 1}`,
      lastMessage:
        '긴 최근 메시지도 사진과 안 읽은 수를 밀어내지 않고 한 줄로 표시합니다.',
      unreadCount: index === 0 ? 120 : 0,
    })),
  },
};
export const MobileLongList: Story = {
  ...LongList,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

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

export const MobileSelectedSplit: Story = {
  ...SelectedSplit,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

const PHOTO_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><rect width="360" height="360" fill="#f6d5dc"/><circle cx="180" cy="160" r="72" fill="#e98fa3"/><rect x="96" y="250" width="168" height="28" rx="14" fill="#fff"/></svg>',
  );

export const SelectedSplitWithPhotos: Story = {
  args: {
    presentation: 'split',
    selectedRoom: {
      ...SELECTED_CHAT_ROOM,
      itemImageUrl: PHOTO_URL,
      messages: [
        ...SELECTED_CHAT_ROOM.messages.slice(0, 2),
        {
          id: 'photo-other',
          sender: 'other',
          text: '',
          sentAt: '오전 11:03',
          sentDate: SELECTED_CHAT_ROOM.messages[1]?.sentDate ?? '',
          images: [{ url: PHOTO_URL, name: '받은 사진' }],
        },
        {
          id: 'photo-me',
          sender: 'me',
          text: '제 쪽 사진도 보내드려요.',
          sentAt: '오전 11:05',
          sentDate: SELECTED_CHAT_ROOM.messages[1]?.sentDate ?? '',
          images: [
            { url: PHOTO_URL, name: '보낸 사진 1' },
            { url: PHOTO_URL, name: '보낸 사진 2' },
          ],
        },
      ],
    },
  },
};

export const MobileSelectedSplitWithPhotos: Story = {
  ...SelectedSplitWithPhotos,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
