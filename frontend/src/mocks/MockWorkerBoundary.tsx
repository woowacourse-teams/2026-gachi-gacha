import { useEffect, useState, type ReactNode } from 'react';
import type { RequestHandler } from 'msw';

import { worker } from './browser';

type MockWorkerState = 'loading' | 'ready' | 'error';

export interface MockWorkerBoundaryProps {
  children: ReactNode;
  handlers?: readonly RequestHandler[];
}

let workerStartPromise: ReturnType<typeof worker.start> | null = null;
const EMPTY_HANDLERS: readonly RequestHandler[] = [];

function startMockWorker() {
  workerStartPromise ??= worker.start({ onUnhandledRequest: 'bypass' });

  return workerStartPromise;
}

export function MockWorkerBoundary({
  children,
  handlers = EMPTY_HANDLERS,
}: MockWorkerBoundaryProps) {
  const [workerState, setWorkerState] = useState<MockWorkerState>('loading');

  useEffect(() => {
    let isMounted = true;

    async function prepareMockWorker() {
      try {
        await startMockWorker();

        if (!isMounted) {
          return;
        }

        worker.use(...handlers);
        setWorkerState('ready');
      } catch {
        if (isMounted) {
          setWorkerState('error');
        }
      }
    }

    void prepareMockWorker();

    return () => {
      isMounted = false;

      if (handlers.length > 0) {
        worker.resetHandlers();
      }
    };
  }, [handlers]);

  if (workerState === 'loading') {
    return <p>API 목 환경을 준비하고 있어요.</p>;
  }

  if (workerState === 'error') {
    return <p>API 목 환경을 준비하지 못했습니다.</p>;
  }

  return children;
}
