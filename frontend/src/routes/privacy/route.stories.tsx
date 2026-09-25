import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PrivacyRoute } from './route';

const meta = {
  title: 'Routes/Privacy',
  component: PrivacyRoute,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PrivacyRoute>;

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
