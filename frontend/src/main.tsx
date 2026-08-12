import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다.');
}

const root = createRoot(container);

const renderApp = () => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

if (__IS_DEV__) {
  const startMockWorker = async () => {
    try {
      const { worker } = await import('@/mocks/browser');

      await worker.start({ onUnhandledRequest: 'bypass' });
    } catch (cause) {
      console.warn(
        '목 서버(MSW)를 시작하지 못했습니다. API 요청이 실제 서버로 나갑니다.',
        cause,
      );
    }
  };

  startMockWorker().then(renderApp);
} else {
  renderApp();
}
