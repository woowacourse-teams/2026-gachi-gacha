import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Footer from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'routes/home/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
