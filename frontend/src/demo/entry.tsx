import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// DEV의 opt-in 데모 빌드에서만 선택되는 진입점.
// 기존 main/App은 수정하지 않고 /demo 밖에서는 그대로 실행한다.
if (/^\/demo(?:\/|$)/.test(window.location.pathname)) {
  const container = document.getElementById('root');
  if (!container) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');
  const root = createRoot(container);
  import('./PromoApp')
    .then(({ default: PromoApp }) => {
      root.render(
        <StrictMode>
          <PromoApp />
        </StrictMode>,
      );
    })
    .catch(() => {
      root.render(
        <p role="alert">체험 화면을 불러오지 못했습니다. 새로고침해 주세요.</p>,
      );
    });
} else {
  void import('../main');
}
