import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandCreatePage from './SecondhandCreatePage';

const meta: Meta<typeof SecondhandCreatePage> = {
  title: 'routes/secondhand/SecondhandCreatePage',
  component: SecondhandCreatePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandCreatePage>;

export const Default: Story = {};
