import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { STORE_MARKER_IMAGE, type StoreMarkerImage } from './storeMarkerImage';

interface StoreMarkerImagePreviewProps {
  label: string;
  markerImage: StoreMarkerImage;
}

function StoreMarkerImagePreview({
  label,
  markerImage,
}: StoreMarkerImagePreviewProps) {
  const coordinate = { x: 110, y: 96 };

  return (
    <figure style={{ display: 'grid', gap: 12, margin: 0 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: 220,
          height: 180,
          border: '1px solid rgb(36 33 34 / 8%)',
          borderRadius: 20,
          background:
            'linear-gradient(90deg, transparent 48%, #fff 48%, #fff 52%, transparent 52%), linear-gradient(transparent 47%, #fff 47%, #fff 53%, transparent 53%), #e8e5dc',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: coordinate.y - 2,
            left: coordinate.x - 2,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#d93b54',
          }}
        />
        <img
          src={markerImage.src}
          width={markerImage.width}
          height={markerImage.height}
          alt={`${label} 캡슐 매장 마커`}
          style={{
            position: 'absolute',
            top: coordinate.y - markerImage.anchorY,
            left: coordinate.x - markerImage.anchorX,
          }}
        />
      </div>
      <figcaption
        style={{ color: '#4e494b', fontSize: 14, textAlign: 'center' }}
      >
        {label}
      </figcaption>
    </figure>
  );
}

function StoreMarkerImageGallery() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <StoreMarkerImagePreview
        label="기본 매장"
        markerImage={STORE_MARKER_IMAGE.default}
      />
      <StoreMarkerImagePreview
        label="선택된 매장"
        markerImage={STORE_MARKER_IMAGE.selected}
      />
    </div>
  );
}

const meta = {
  title: 'Shared/Map/StoreMarkerImage',
  component: StoreMarkerImageGallery,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StoreMarkerImageGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultAndSelected: Story = {};
