import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CardListSection from './CardListSection';

const meta: Meta<typeof CardListSection> = {
  title: 'routes/home/CardListSection',
  component: CardListSection,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof CardListSection>;

export const Default: Story = {
  args: {
    title: '산리오 캐릭터즈 인기 컬렉션',
    items: [
      {
        id: 1,
        imageUrl: '',
        name: '산리오 스탠드 피규어',
      },
      {
        id: 2,
        imageUrl: '',
        name: '시나모롤 마스코트 키링',
      },
      {
        id: 3,
        imageUrl: '',
        name: '쿠로미 미니 피규어 vol.2',
      },
      {
        id: 4,
        imageUrl: '',
        name: '폼폼푸린 푸딩 컵',
      },
    ],
  },
};
