import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandPage from './SecondhandPage';

const meta: Meta<typeof SecondhandPage> = {
  title: 'routes/secondhand/SecondhandPage',
  component: SecondhandPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandPage>;

export const Default: Story = {};
