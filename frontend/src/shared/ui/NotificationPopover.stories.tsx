import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import {
  type HeaderNotification,
  NotificationPopover,
} from './NotificationPopover';

const notifications = [
  {
    id: 'chat-1',
    type: 'chat',
    title: '새로운 채팅이 도착했어요',
    message: '혹시 쿠로미 키링이랑도 교환 가능할까요?',
    createdAtLabel: '방금 전',
    isRead: false,
    destination: '/chat',
  },
  {
    id: 'trade-1',
    type: 'trade',
    title: '교환 상태가 변경되었어요',
    message: '산리오 캐릭터즈 캡슐토이 세트가 교환 완료되었어요.',
    createdAtLabel: '12분 전',
    isRead: false,
    destination: '/trade/99',
  },
  {
    id: 'gacha-1',
    type: 'gacha',
    title: '관심 가챠를 찾았어요',
    message: '가까운 매장에 치이카와 신상품이 등록되었어요.',
    createdAtLabel: '어제',
    isRead: true,
    destination: '/search',
  },
] satisfies readonly HeaderNotification[];

const previewDecorator = (Story: () => React.JSX.Element) => (
  <MemoryRouter>
    <div
      style={{
        minHeight: '100vh',
        padding: '80px 24px',
        background: '#f7f6f4',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(390px, 100%)',
          margin: '0 auto',
        }}
      >
        <Story />
      </div>
    </div>
  </MemoryRouter>
);

const meta = {
  title: 'Shared/UI/NotificationPopover',
  component: NotificationPopover,
  decorators: [previewDecorator],
  parameters: { layout: 'fullscreen' },
  args: {
    id: 'storybook-notification-popover',
    titleId: 'storybook-notification-title',
    onClose: () => undefined,
  },
} satisfies Meta<typeof NotificationPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithNotifications: Story = {
  name: '알림 목록',
  args: {
    notificationState: {
      status: 'success',
      data: notifications,
      errorMessage: null,
    },
  },
};

export const Empty: Story = {
  name: '빈 상태',
  args: {
    notificationState: {
      status: 'success',
      data: [],
      errorMessage: null,
    },
  },
};

export const Loading: Story = {
  name: '로딩',
  args: {
    notificationState: {
      status: 'loading',
      data: null,
      errorMessage: null,
    },
  },
};

export const ErrorState: Story = {
  name: '오류',
  args: {
    notificationState: {
      status: 'error',
      data: null,
      errorMessage: '알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
    },
    onRetry: () => undefined,
  },
};

export const Mobile: Story = {
  args: {
    notificationState: {
      status: 'success',
      data: notifications,
      errorMessage: null,
    },
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
