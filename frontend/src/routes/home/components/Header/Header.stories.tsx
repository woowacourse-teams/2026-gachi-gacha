import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Header from './Header';

const meta: Meta<typeof Header> = {
  title: 'routes/home/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
