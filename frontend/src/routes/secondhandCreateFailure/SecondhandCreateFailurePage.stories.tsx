import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandCreateFailurePage from './SecondhandCreateFailurePage';

const meta: Meta<typeof SecondhandCreateFailurePage> = {
  title: 'routes/secondhandCreateFailure/SecondhandCreateFailurePage',
  component: SecondhandCreateFailurePage,
  args: {
    errorMessage: '사진 업로드 중 문제가 발생했습니다.',
    onRetry: () => undefined,
    onMoveToFeed: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandCreateFailurePage>;

export const Default: Story = {};
