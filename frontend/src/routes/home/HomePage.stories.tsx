import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HomePage from './HomePage';

const meta: Meta<typeof HomePage> = {
  title: 'routes/home/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof HomePage>;

export const Default: Story = {};
