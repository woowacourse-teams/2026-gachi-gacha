import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SearchHero from './SearchHero';

const meta: Meta<typeof SearchHero> = {
  title: 'routes/home/SearchHero',
  component: SearchHero,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SearchHero>;

export const Default: Story = {};
