import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { worker } from '@/mocks/browser';

import { SearchRoute, type SearchRouteProps } from './route';

type MockWorkerState = 'loading' | 'ready' | 'error';

let workerStartPromise: ReturnType<typeof worker.start> | null = null;

function startMockWorker() {
  workerStartPromise ??= worker.start({ onUnhandledRequest: 'bypass' });

  return workerStartPromise;
}

function MockedSearchRoute(props: SearchRouteProps) {
  const [workerState, setWorkerState] = useState<MockWorkerState>('loading');

  useEffect(() => {
    let isMounted = true;

    async function prepareMockWorker() {
      try {
        await startMockWorker();

        if (isMounted) {
          setWorkerState('ready');
        }
      } catch {
        if (isMounted) {
          setWorkerState('error');
        }
      }
    }

    void prepareMockWorker();

    return () => {
      isMounted = false;
    };
  }, []);

  if (workerState === 'loading') {
    return <p>검색 결과 목 환경을 준비하고 있어요.</p>;
  }

  if (workerState === 'error') {
    return <p>검색 결과 목 환경을 준비하지 못했습니다.</p>;
  }

  return <SearchRoute {...props} />;
}

const meta = {
  title: 'Routes/Search/SearchRoute',
  component: SearchRoute,
  render: (args) => <MockedSearchRoute {...args} />,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    search: '?gachaId=10',
  },
} satisfies Meta<typeof SearchRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const EmptyStores: Story = {
  args: {
    search: '?gachaId=12',
  },
};

export const InvalidGachaId: Story = {
  args: {
    search: '?gachaId=invalid',
  },
};
