import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from '@/App';
import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { initializeAnalytics } from '@/shared/analytics/analyticsClient';
import { AppErrorBoundary } from '@/shared/errorMonitoring/AppErrorBoundary';
import {
  getReactRootErrorHandlers,
  initializeErrorMonitoring,
} from '@/shared/errorMonitoring/errorMonitoringClient';
import { ErrorMonitoringContext } from '@/shared/errorMonitoring/ErrorMonitoringContext';

initializeErrorMonitoring();

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다.');
}

async function enableMocking(): Promise<void> {
  if (!__USE_MSW__) {
    return;
  }

  const { worker } = await import('@/mocks/browser');

  await worker.start({ onUnhandledRequest: 'warn' });
}

void enableMocking().then(() => {
  initializeAnalytics();

  const errorHandlers = getReactRootErrorHandlers();
  const root = errorHandlers
    ? createRoot(container, errorHandlers)
    : createRoot(container);

  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <AuthSessionProvider>
            <ErrorMonitoringContext />
            <App />
          </AuthSessionProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </StrictMode>,
  );
});
