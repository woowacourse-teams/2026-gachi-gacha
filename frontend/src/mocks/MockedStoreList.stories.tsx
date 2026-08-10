import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { MockStore } from './handlers';

function MockedStoreList() {
  const [stores, setStores] = useState<MockStore[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/stores', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`매장 목록 요청 실패: ${response.status}`);
        }

        return response.json() as Promise<MockStore[]>;
      })
      .then(setStores)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setHasError(true);
      });

    return () => controller.abort();
  }, []);

  if (hasError) {
    return <p role="alert">매장 목록을 불러오지 못했습니다.</p>;
  }

  if (!stores) {
    return <p>매장 목록을 불러오는 중입니다.</p>;
  }

  return (
    <ul>
      {stores.map((store) => (
        <li key={store.id}>{store.name}</li>
      ))}
    </ul>
  );
}

const meta = {
  title: 'Mocks/Store list',
  component: MockedStoreList,
} satisfies Meta<typeof MockedStoreList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};
