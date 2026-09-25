import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { initializeAnalytics } from '@/shared/analytics/analyticsClient';

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

  createRoot(container).render(
    <StrictMode>
      <AuthSessionProvider>
        <App />
      </AuthSessionProvider>
    </StrictMode>,
  );
});
