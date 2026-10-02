import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { worker } from '@/mocks/browser';

import { GachaSearchPopoverContainer } from './GachaSearchPopoverContainer';

type MockWorkerState = 'loading' | 'ready' | 'error';

let workerStartPromise: ReturnType<typeof worker.start> | null = null;

function startMockWorker() {
  workerStartPromise ??= worker.start({ onUnhandledRequest: 'bypass' });

  return workerStartPromise;
}

function PaginatedSearchPreview() {
  const [workerState, setWorkerState] = useState<MockWorkerState>('loading');
  const [isOpen, setIsOpen] = useState(true);
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
    <div
      style={{
        position: 'relative',
        width: 'min(680px, 100%)',
        margin: '0 auto',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          height: 54,
          padding: '0 20px',
          border: '1px solid #dedbd8',
          borderRadius: 16,
          background: '#ffffff',
          color: '#4b4547',
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        ⌕ 산리오
      </button>

      {selectedGachaId && (
        <p style={{ color: '#d93b54', fontWeight: 700 }}>
          선택한 가챠 ID: {selectedGachaId}
        </p>
      )}

      {isOpen && (
        <GachaSearchPopoverContainer
          query="산리오"
          onClose={() => setIsOpen(false)}
          onSelect={(gachaId) => {
            setSelectedGachaId(gachaId);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}

const meta = {
  title: 'Features/GachaSearch/GachaSearchPopoverContainer',
  component: GachaSearchPopoverContainer,
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '100vh',
          padding: '72px 24px',
          background: '#f7f6f4',
          fontFamily: 'Arial, sans-serif',
          boxSizing: 'border-box',
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
    query: '산리오',
    onClose: () => undefined,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof GachaSearchPopoverContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PaginatedSearch: Story = {
  render: () => <PaginatedSearchPreview />,
};
