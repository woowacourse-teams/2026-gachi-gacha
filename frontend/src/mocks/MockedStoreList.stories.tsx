import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  DEFAULT_RADIUS,
  getNearbyStores,
  type NearbyStore,
} from '@/apis/store';

interface MockedStoreListProps {
  latitude: number;
  longitude: number;
}

function MockedStoreList({ latitude, longitude }: MockedStoreListProps) {
  const [stores, setStores] = useState<NearbyStore[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setStores(null);
    setHasError(false);

    getNearbyStores(
      { latitude, longitude, radius: DEFAULT_RADIUS },
      controller.signal,
    )
      .then((data) => setStores(data.stores))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setHasError(true);
      });

    return () => controller.abort();
  }, [latitude, longitude]);

  if (hasError) {
    return <p role="alert">매장 목록을 불러오지 못했습니다.</p>;
  }

  if (!stores) {
    return <p>매장 목록을 불러오는 중입니다.</p>;
  }

  return (
    <ul>
      {stores.map((store) => (
        <li key={store.storeId}>
          {store.storeId}번 매장 · {store.distance}m
        </li>
      ))}
    </ul>
  );
}

const meta = {
  title: 'Mocks/Store list',
  component: MockedStoreList,
  args: {
    latitude: 37.5551,
    longitude: 126.9251,
  },
} satisfies Meta<typeof MockedStoreList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const InternationalElectronicsCenter: Story = {
  args: {
    latitude: 37.4847435,
    longitude: 127.0178182,
  },
};
