import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { worker } from '@/mocks/browser';

import { GachaSearchBar } from './GachaSearchBar';

type MockWorkerState = 'loading' | 'ready' | 'error';

let workerStartPromise: ReturnType<typeof worker.start> | null = null;

function startMockWorker() {
  workerStartPromise ??= worker.start({ onUnhandledRequest: 'bypass' });

  return workerStartPromise;
}

function SearchBarPreview() {
  const [workerState, setWorkerState] = useState<MockWorkerState>('loading');
  const [selectedGachaId, setSelectedGachaId] = useState<number | null>(null);

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
    return <p>검색 API 목 환경을 준비하고 있어요.</p>;
  }

  if (workerState === 'error') {
    return <p>검색 API 목 환경을 준비하지 못했습니다.</p>;
  }

  return (
    <>
      <GachaSearchBar initialQuery="산리오" onSelect={setSelectedGachaId} />
      {selectedGachaId !== null && (
        <p aria-live="polite" style={{ color: '#d93b54', fontWeight: 700 }}>
          선택한 가챠 ID: {selectedGachaId}
        </p>
      )}
    </>
  );
}

const meta = {
  title: 'Features/GachaSearch/GachaSearchBar',
  component: GachaSearchBar,
  render: () => <SearchBarPreview />,
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '100vh',
          padding: '72px 24px',
          background: '#f7f6f4',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ width: 'min(720px, 100%)', margin: '0 auto' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onSelect: () => undefined,
  },
} satisfies Meta<typeof GachaSearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
