import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandPage from './SecondhandPage';
import { SECONDHAND_ITEMS } from './storybook/secondhandMocks';

const meta: Meta<typeof SecondhandPage> = {
  title: 'routes/secondhand/SecondhandPage',
  component: SecondhandPage,
  args: {
    items: SECONDHAND_ITEMS,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandPage>;

export const Default: Story = {};
