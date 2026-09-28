import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ProfileEditDialog } from './ProfileEditDialog';

const member = {
  nickname: '가챠러 민지',
  profileImageUrl: null,
  desireTradeLocation: '홍대입구역',
};

const meta = {
  title: 'Routes/MyPage/ProfileEditDialog',
  component: ProfileEditDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    member,
    onClose: () => undefined,
    onSave: async () => undefined,
  },
} satisfies Meta<typeof ProfileEditDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const FailedSubmission: Story = {
  args: {
    onSave: async () => {
      throw new Error('회원 정보를 저장하지 못했습니다.');
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
