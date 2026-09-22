import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { SelectedGachaSummary } from './SelectedGachaSummary';

function createThumbnail(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <rect width="320" height="320" rx="48" fill="#fbf0f2" />
      <circle cx="160" cy="130" r="72" fill="#d93b54" opacity="0.22" />
      <circle cx="160" cy="130" r="44" fill="#d93b54" opacity="0.76" />
      <rect x="118" y="196" width="84" height="54" rx="18" fill="#d93b54" />
      <text x="160" y="287" text-anchor="middle" fill="#4b4547" font-size="24" font-family="sans-serif" font-weight="700">GACHA</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const meta = {
  title: 'Routes/Search/SelectedGachaSummary',
  component: SelectedGachaSummary,
  decorators: [
    (Story) => (
      <div
        style={{
          width: 'min(760px, 100%)',
          margin: '0 auto',
          padding: '48px 20px',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    selectedGacha: {
      status: 'success',
      data: {
        gachaId: 10,
        name: '산리오 캐릭터즈 스탠드 피규어',
        thumbnailUrl: createThumbnail(),
        categories: ['산리오', '캐릭터', '피규어'],
      },
      errorMessage: null,
    },
  },
} satisfies Meta<typeof SelectedGachaSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const WithoutImage: Story = {
  args: {
    selectedGacha: {
      status: 'success',
      data: {
        gachaId: 11,
        name: '쿠로미 미니 피규어 vol.2',
        thumbnailUrl: null,
        categories: ['산리오', '쿠로미', '피규어'],
      },
      errorMessage: null,
    },
  },
};

export const LongContent: Story = {
  args: {
    selectedGacha: {
      status: 'success',
      data: {
        gachaId: 12,
        name: '산리오 캐릭터즈 스페셜 애니버서리 한정판 스탠드 피규어 컬렉션',
        thumbnailUrl: createThumbnail(),
        categories: ['산리오', '캐릭터', '피규어', '한정판', '미니어처'],
      },
      errorMessage: null,
    },
  },
};

export const Loading: Story = {
  args: {
    selectedGacha: {
      status: 'loading',
      data: null,
      errorMessage: null,
    },
  },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    selectedGacha: {
      status: 'error',
      data: null,
      errorMessage: '선택한 가챠 정보를 불러오지 못했습니다.',
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
