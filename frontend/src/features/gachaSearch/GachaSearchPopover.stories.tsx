import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { GachaProductSummary } from '@/domains/product/gachaProductType';

import { GachaSearchPopover } from './GachaSearchPopover';

function createThumbnail(label: string, color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
      <rect width="480" height="360" rx="36" fill="#fbf0f2" />
      <circle cx="240" cy="155" r="92" fill="${color}" opacity="0.2" />
      <circle cx="240" cy="155" r="58" fill="${color}" opacity="0.72" />
      <rect x="205" y="220" width="70" height="42" rx="16" fill="${color}" />
      <text x="240" y="314" text-anchor="middle" fill="#4b4547" font-size="27" font-family="sans-serif" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

interface ProductFixture {
  name: string;
  categories: readonly string[];
  color: string;
}

const productFixtures = [
  {
    name: '산리오 캐릭터즈 스탠드 피규어',
    categories: ['산리오', '피규어'],
    color: '#d93b54',
  },
  {
    name: '쿠로미 미니 피규어 vol.2',
    categories: ['산리오', '쿠로미'],
    color: '#67506f',
  },
  {
    name: '시나모롤 마스코트 키링',
    categories: ['산리오', '키링'],
    color: '#79a9ca',
  },
  {
    name: '폼폼푸린 푸딩 컵',
    categories: ['산리오', '미니어처'],
    color: '#d5a238',
  },
  {
    name: '마이멜로디 리본 참',
    categories: ['산리오', '마이멜로디'],
    color: '#e889a1',
  },
  {
    name: '헬로키티 레트로 파우치',
    categories: ['산리오', '파우치'],
    color: '#d8494f',
  },
  {
    name: '한교동 아쿠아 피규어',
    categories: ['산리오', '한교동'],
    color: '#4e91a8',
  },
  {
    name: '포차코 데스크 마스코트',
    categories: ['산리오', '포차코'],
    color: '#7a9b75',
  },
  {
    name: '배드바츠마루 미니 스탬프',
    categories: ['산리오', '문구'],
    color: '#3c3a40',
  },
  {
    name: '리틀트윈스타 구름 키링',
    categories: ['산리오', '키링'],
    color: '#8c83bd',
  },
] satisfies readonly ProductFixture[];

const products = productFixtures.map(({ name, categories, color }, index) => ({
  gachaId: index + 1,
  name,
  categories,
  thumbnailUrl: createThumbnail(`GACHA ${index + 1}`, color),
})) satisfies readonly GachaProductSummary[];

const previewDecorator = (Story: () => React.JSX.Element) => (
  <div
    style={{
      minHeight: '100vh',
      padding: '72px 24px',
      background: '#f7f6f4',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        position: 'relative',
        width: 'min(560px, 100%)',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          height: 54,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #dedbd8',
          borderRadius: 16,
          background: '#ffffff',
          color: '#4b4547',
          boxShadow: '0 6px 18px rgb(35 31 32 / 6%)',
        }}
      >
        <span aria-hidden="true" style={{ marginRight: 12 }}>
          ⌕
        </span>
        산리오
      </div>
      <Story />
    </div>
  </div>
);

const meta = {
  title: 'Features/GachaSearch/GachaSearchPopover',
  component: GachaSearchPopover,
  decorators: [previewDecorator],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    query: '산리오',
    onClose: () => undefined,
    onRetry: () => undefined,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof GachaSearchPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Results: Story = {
  args: {
    searchState: {
      status: 'success',
      data: products,
      errorMessage: null,
    },
  },
};

export const Loading: Story = {
  args: {
    searchState: {
      status: 'loading',
      data: null,
      errorMessage: null,
    },
  },
};

export const Empty: Story = {
  args: {
    searchState: {
      status: 'success',
      data: [],
      errorMessage: null,
    },
  },
};

export const Error: Story = {
  args: {
    searchState: {
      status: 'error',
      data: null,
      errorMessage: '검색 결과를 불러오지 못했습니다.',
    },
  },
};

export const Mobile: Story = {
  args: {
    searchState: {
      status: 'success',
      data: products,
      errorMessage: null,
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
