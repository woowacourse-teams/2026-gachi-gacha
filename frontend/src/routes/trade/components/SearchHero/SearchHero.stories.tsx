import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SearchHero from './SearchHero';

const meta = {
  title: 'routes/trade/SearchHero',
  component: SearchHero,
  args: {
    title: '어떤 가챠를 교환해볼까요?',
    onSearch: () => undefined,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SearchHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
