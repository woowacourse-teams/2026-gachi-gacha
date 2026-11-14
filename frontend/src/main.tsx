import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from '@/App';
import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { NotificationProvider } from '@/features/notifications/NotificationContext';
import { initializeAnalytics } from '@/shared/analytics/analyticsClient';
import { AppErrorBoundary } from '@/shared/errorMonitoring/AppErrorBoundary';
import {
  getReactRootErrorHandlers,
  initializeErrorMonitoring,
} from '@/shared/errorMonitoring/errorMonitoringClient';
import { ErrorMonitoringContext } from '@/shared/errorMonitoring/ErrorMonitoringContext';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다.');
}

async function enableMocking(): Promise<void> {
  if (!__USE_MSW__) {
    return;
  }

  const [{ worker }, { storeAuthTokens }, { MOCK_AUTH_TOKENS }] =
    await Promise.all([
      import('@/mocks/browser'),
      import('@/features/auth/authTokenStorage'),
      import('@/mocks/mockAuth'),
    ]);

  await worker.start({ onUnhandledRequest: 'warn' });
  storeAuthTokens(MOCK_AUTH_TOKENS);
}

void enableMocking().then(() => {
  initializeErrorMonitoring();
  initializeAnalytics();

  createRoot(container, getReactRootErrorHandlers()).render(
    <StrictMode>
      <BrowserRouter>
        <AuthSessionProvider>
          <ErrorMonitoringContext />
          <AppErrorBoundary>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AppErrorBoundary>
        </AuthSessionProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
