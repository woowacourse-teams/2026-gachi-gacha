import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { AppErrorFallback } from '@/shared/errorMonitoring/AppErrorFallback';

import { ErrorState } from './ErrorState';

const meta = {
  title: 'Shared/ErrorState',
  component: ErrorState,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ padding: '48px 0' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    title: '불러오지 못했어요',
    description: '잠시 후 다시 시도해 주세요.',
    action: { label: '다시 시도', onClick: () => undefined },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadFailed: Story = {};

export const NotFound: Story = {
  args: {
    icon: 'question',
    title: '페이지를 찾을 수 없어요',
    description: '주소가 바뀌었거나 삭제된 페이지예요.',
    action: { label: '홈으로', to: '/trade' },
  },
};

export const Forbidden: Story = {
  args: {
    icon: 'lock',
    title: '접근할 수 없는 페이지예요',
    description: '내가 쓴 글만 수정할 수 있어요.',
    action: { label: '홈으로', to: '/trade' },
  },
};

export const Offline: Story = {
  args: {
    icon: 'wifi-off',
    title: '인터넷 연결을 확인해 주세요.',
    description: '연결되면 다시 시도해 주세요.',
  },
};

export const ServerErrorScreen: Story = {
  render: () => <AppErrorFallback onReload={() => undefined} />,
  parameters: { layout: 'fullscreen' },
};
