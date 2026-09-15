import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CategoryNav from './CategoryNav';

const meta: Meta<typeof CategoryNav> = {
  title: 'routes/home/CategoryNav',
  component: CategoryNav,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof CategoryNav>;

export const Default: Story = {};
