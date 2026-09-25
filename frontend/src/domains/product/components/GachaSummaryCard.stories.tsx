import type { Meta, StoryObj } from '@storybook/react-webpack5';

import sanrioStand from '@/demo/assets/sanrio-stand.jpg';

import { GachaSummaryCard } from './GachaSummaryCard';

const meta = {
  title: 'Product/GachaSummaryCard',
  component: GachaSummaryCard,
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  args: {
    product: {
      gachaId: 10,
      name: '산리오 캐릭터즈 스탠드 피규어',
      thumbnailUrl: sanrioStand,
      categories: ['산리오', '피규어', '캐릭터'],
    },
    imageAlt: '산리오 캐릭터즈 스탠드 피규어 섬네일',
  },
} satisfies Meta<typeof GachaSummaryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongName: Story = {
  args: {
    product: {
      ...meta.args.product,
      name: '산리오 캐릭터즈 프리미엄 스탠드 피규어 애니버서리 컬렉션',
    },
  },
};

export const WithoutImageAndCategory: Story = {
  args: {
    product: {
      ...meta.args.product,
      thumbnailUrl: null,
      categories: [],
    },
  },
};
