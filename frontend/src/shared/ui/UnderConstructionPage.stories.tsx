import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { UnderConstructionPage } from './UnderConstructionPage';

const meta = {
  title: 'Shared/UnderConstructionPage',
  component: UnderConstructionPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    title: '새로운 페이지를 준비하고 있어요',
    description:
      '더 좋은 경험으로 찾아올게요. 지금은 가챠 매장 검색을 이용해 주세요.',
  },
} satisfies Meta<typeof UnderConstructionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
