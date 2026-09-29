import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SecondhandDetailPage from './SecondhandDetailPage';
import { SECONDHAND_DETAIL } from './storybook/secondhandDetailMocks';
import { SECONDHAND_ITEMS } from '../secondhand/storybook/secondhandMocks';

const meta: Meta<typeof SecondhandDetailPage> = {
  title: 'routes/secondhand/SecondhandDetailPage',
  component: SecondhandDetailPage,
  args: {
    detail: SECONDHAND_DETAIL,
    relatedItems: SECONDHAND_ITEMS,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SecondhandDetailPage>;

export const Default: Story = {};
