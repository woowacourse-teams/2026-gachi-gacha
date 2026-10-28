import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { AccountDeletionDialog } from './AccountDeletionDialog';

const meta = {
  title: 'Routes/MyPage/AccountDeletionDialog',
  component: AccountDeletionDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: () => undefined,
    onDelete: async () => {
      throw new Error('검수 화면에서는 실제 계정을 삭제하지 않아요.');
    },
  },
} satisfies Meta<typeof AccountDeletionDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const FailedSubmission: Story = {
  args: {
    onDelete: async () => {
      throw new Error('회원 탈퇴를 완료하지 못했습니다.');
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
