import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CategoryNav from './CategoryNav';
import { DEFAULT_CATEGORY } from '../../model/categories';

const meta: Meta<typeof CategoryNav> = {
  title: 'routes/home/CategoryNav',
  component: CategoryNav,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof CategoryNav>;

export const Default: Story = {
  args: {
    selected: DEFAULT_CATEGORY,
    onSelect: () => {},
  },
};

/** 클릭했을 때 선택이 실제로 바뀌는지 확인하는 스토리 */
export const Selectable: Story = {
  render: function Selectable() {
    const [selected, setSelected] = useState(DEFAULT_CATEGORY);

    return <CategoryNav selected={selected} onSelect={setSelected} />;
  },
};
