import type { Meta, StoryObj } from '@storybook/react-webpack5';

import routes from './routes';

const meta: Meta<typeof routes> = {
  title: 'routes/home/routes',
  component: routes,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof routes>;

export const Default: Story = {};
