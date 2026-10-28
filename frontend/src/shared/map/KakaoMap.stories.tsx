import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { KakaoMap, type KakaoMapProps } from './KakaoMap';
import type { MapCoordinate } from './mapCoordinateType';

const HONGIK_UNIVERSITY_STATION = {
  latitude: 37.5575,
  longitude: 126.9245,
} satisfies MapCoordinate;

const HAPJEONG_STATION = {
  latitude: 37.5496,
  longitude: 126.9139,
} satisfies MapCoordinate;

function InteractiveMap(props: KakaoMapProps) {
  const [center, setCenter] = useState(props.center);

  return (
    <div
      style={{
        display: 'grid',
        width: '100%',
        height: '100vh',
        padding: 24,
        gridTemplateRows: 'auto minmax(0, 1fr)',
        gap: 16,
        boxSizing: 'border-box',
        background: '#f7f6f4',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={() => setCenter(HONGIK_UNIVERSITY_STATION)}
          style={buttonStyle}
        >
          홍대입구로 이동
        </button>
        <button
          type="button"
          onClick={() => setCenter(HAPJEONG_STATION)}
          style={buttonStyle}
        >
          합정으로 이동
        </button>
      </div>
      <KakaoMap {...props} center={center} />
    </div>
  );
}

const buttonStyle = {
  minHeight: 40,
  padding: '0 16px',
  border: '1px solid #d93b54',
  borderRadius: 999,
  background: '#ffffff',
  color: '#d93b54',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties;

const meta = {
  title: 'Shared/Map/KakaoMap',
  component: KakaoMap,
  render: (args) => <InteractiveMap {...args} />,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    center: HONGIK_UNIVERSITY_STATION,
    level: 4,
    label: '홍대 주변 가챠 매장 지도',
  },
} satisfies Meta<typeof KakaoMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
