import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  CurrentLocationButton,
  type CurrentLocationButtonProps,
} from './CurrentLocationButton';
import {
  CURRENT_LOCATION_MARKER_IMAGE_URL,
  CURRENT_LOCATION_MARKER_SIZE,
} from './currentLocationMarkerImage';

function LocationPreview(props: CurrentLocationButtonProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: 'min(720px, calc(100vw - 40px))',
        height: 'min(520px, calc(100vh - 40px))',
        minHeight: 360,
        borderRadius: 24,
        background:
          'linear-gradient(90deg, transparent 47%, #ffffff 47%, #ffffff 53%, transparent 53%), linear-gradient(transparent 46%, #ffffff 46%, #ffffff 54%, transparent 54%), #e8e5dc',
        boxShadow: '0 16px 48px rgb(36 33 34 / 12%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '12%',
          width: '24%',
          height: '22%',
          borderRadius: 24,
          background: '#dce8cf',
        }}
      />
      <img
        src={CURRENT_LOCATION_MARKER_IMAGE_URL}
        width={CURRENT_LOCATION_MARKER_SIZE}
        height={CURRENT_LOCATION_MARKER_SIZE}
        alt="파란색 현재 위치 마커 시안"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div style={{ position: 'absolute', right: 18, bottom: 18 }}>
        <CurrentLocationButton {...props} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Shared/Map/CurrentLocationControl',
  component: CurrentLocationButton,
  render: (args) => (
    <div
      style={{
        display: 'grid',
        minHeight: '100vh',
        padding: 20,
        placeItems: 'center',
        boxSizing: 'border-box',
        background: '#f7f6f4',
      }}
    >
      <LocationPreview {...args} />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isLocating: false,
    onLocate: () => undefined,
  },
} satisfies Meta<typeof CurrentLocationButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Locating: Story = {
  args: {
    isLocating: true,
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
