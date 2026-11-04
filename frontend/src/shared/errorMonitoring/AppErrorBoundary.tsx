import type { ReactNode } from 'react';
import * as Sentry from '@sentry/react';

import { AppErrorFallback } from './AppErrorFallback';

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={<AppErrorFallback />}
      beforeCapture={(scope) => {
        scope.setLevel('fatal');
        scope.setTag('error.boundary', 'root');
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
