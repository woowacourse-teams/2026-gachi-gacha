import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';

import { AppHeader } from './AppHeader';

const meta = {
  title: 'Shared/UI/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    currentPath: '/search',
    search: <GachaSearchBar onSelect={() => undefined} />,
  },
} satisfies Meta<typeof AppHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MapActive: Story = {};

export const HomeActive: Story = {
  args: {
    currentPath: '/',
  },
};
