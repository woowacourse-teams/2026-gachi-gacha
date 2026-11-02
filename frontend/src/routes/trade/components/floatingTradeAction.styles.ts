import { css } from '@emotion/react';

import { breakpoint } from '@/shared/styles/tokens';

/** 거래 목록 부동 액션이 데스크톱과 모바일에서 같은 우측 축을 공유하게 한다. */
export const floatingTradeActionSizeAndPosition = css`
  right: max(24px, env(safe-area-inset-right));
  width: 60px;
  height: 60px;

  @media (max-width: ${breakpoint.mobile}) {
    right: max(16px, env(safe-area-inset-right));
    width: 56px;
    height: 56px;
  }
`;
