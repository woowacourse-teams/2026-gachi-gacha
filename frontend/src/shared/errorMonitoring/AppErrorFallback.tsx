import styled from '@emotion/styled';

import { color } from '@/shared/styles/tokens';
import { ErrorState } from '@/shared/ui/ErrorState';

/**
 * 앱 전체가 그려지지 못했을 때의 화면 (서버 오류 시안).
 * 라우터 밖에서도 그려질 수 있어 링크 없이 버튼만 쓴다.
 */
export function AppErrorFallback({
  onReload = () => window.location.reload(),
}: {
  onReload?: () => void;
}) {
  return (
    <Screen>
      <ErrorState
        announce
        headingLevel={1}
        title="잠시 문제가 생겼어요"
        description="잠시 후 다시 시도해 주세요."
        action={{ label: '다시 시도', onClick: onReload }}
      />
    </Screen>
  );
}

const Screen = styled.main`
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  background: ${color.surface};
`;
