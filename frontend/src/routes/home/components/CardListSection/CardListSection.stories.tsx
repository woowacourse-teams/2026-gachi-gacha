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
        gachaId: 1,
        name: '산리오 스탠드 피규어',
        thumbnailUrl: null,
        categories: ['산리오'],
      },
      {
        gachaId: 2,
        name: '시나모롤 마스코트 키링',
        thumbnailUrl: null,
        categories: ['산리오', '키링'],
      },
      {
        gachaId: 3,
        name: '쿠로미 미니 피규어 vol.2',
        thumbnailUrl: null,
        categories: ['산리오', '피규어'],
      },
      {
        gachaId: 4,
        name: '폼폼푸린 푸딩 컵',
        thumbnailUrl: null,
        categories: ['산리오'],
      },
    ],
  },
};
