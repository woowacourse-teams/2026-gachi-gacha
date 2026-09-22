import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PageLoadingFallback } from './PageLoadingFallback';

const meta = {
  title: 'Shared/UI/PageLoadingFallback',
  component: PageLoadingFallback,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PageLoadingFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
