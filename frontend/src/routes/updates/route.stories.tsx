import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { UpdatesRoute } from './route';

const meta = {
  title: 'Routes/Updates',
  component: UpdatesRoute,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UpdatesRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
