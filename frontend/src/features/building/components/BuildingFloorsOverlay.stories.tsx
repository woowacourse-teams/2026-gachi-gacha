import type { Meta, StoryObj } from '@storybook/react-webpack5';

import BuildingFloorsOverlay from './BuildingFloorsOverlay';
import { GUKJE_ELECTRONICS_CENTER_FLOORS } from '../model/buildingFloors';
import { GACHA_BUILDINGS } from '../model/gachaBuilding';

const building = GACHA_BUILDINGS[0];

if (building === undefined) {
  throw new Error('건물 목록이 비어 있습니다.');
}

const meta = {
  title: 'building/BuildingFloorsOverlay',
  component: BuildingFloorsOverlay,
  parameters: { layout: 'fullscreen' },
  args: {
    building,
    floors: GUKJE_ELECTRONICS_CENTER_FLOORS,
    onClose: () => {},
  },
  // 지도 위에 겹치는 층이라 `position: absolute` 다. 기준이 될 상자를 만들어 준다.
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 430, height: 860 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BuildingFloorsOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 지금 상태. 층별 도면도 가챠샵 개수도 아직 없다. */
export const Default: Story = {};

/**
 * 데이터가 다 들어왔을 때. 층마다 도면이 있고 개수도 채워진다.
 * 도면 자리에는 아직 그림이 없어 임시 판이 그대로 나온다.
 */
export const WithShopCounts: Story = {
  args: {
    floors: GUKJE_ELECTRONICS_CENTER_FLOORS.map((floor) => ({
      ...floor,
      shopCount: [0, 4, 9, 12, 18, 24, 15, 7, 3][floor.floor - 1] ?? 0,
    })),
    onViewFloorMap: () => {},
  },
};
