import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'routes/home/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    imageUrl: '',
    name: '산리오 스탠드 피규어',
  },
};
