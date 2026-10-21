import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import {
  type HeaderNotification,
  NotificationPopover,
} from './NotificationPopover';

const notifications = [
  {
    id: 'comment-1',
    type: 'comment',
    title: '새 댓글이 달렸어요',
    message: '가챠친구: 혹시 주말에도 교환 가능하신가요?',
    createdAtLabel: '방금 전',
    isRead: false,
    destination: '/trade/7',
  },
  {
    id: 'comment-2',
    type: 'comment',
    title: '새 댓글이 달렸어요',
    message: '우디: 홍대입구역에서 가능할까요?',
    createdAtLabel: '5분 전',
    isRead: true,
    destination: '/trade/99',
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
