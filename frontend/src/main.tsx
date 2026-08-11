import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다.');
}

const localHosts = new Set(['localhost', '127.0.0.1']);

async function enableMocking() {
  if (!localHosts.has(window.location.hostname)) return;

  const { worker } = await import('@/mocks/browser');

  await worker.start({ onUnhandledRequest: 'bypass' });
}

function renderApp() {
  createRoot(container as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void enableMocking().then(renderApp);
