import type { ReactNode } from 'react';
import * as Sentry from '@sentry/react';

import { AppErrorFallback } from './AppErrorFallback';

export interface AppErrorBoundaryProps {
  children: ReactNode;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
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
