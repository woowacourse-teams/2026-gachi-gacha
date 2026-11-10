import styled from '@emotion/styled';

import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { zIndex } from '@/shared/styles/tokens';

/** Pen `App/Error Banner`: 인터넷이 끊기면 위쪽에 표시하고, 다시 연결되면 사라진다. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <Live role="status" aria-live="polite">
      {!isOnline && (
        <Banner>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h.01" />
            <path d="M8.5 16.43a5 5 0 0 1 7 0" />
            <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
            <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
            <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
            <path d="M5 13a10 10 0 0 1 5.24-2.76" />
            <path d="m2 2 20 20" />
          </svg>
          인터넷 연결을 확인해 주세요.
        </Banner>
      )}
    </Live>
  );
}

const Live = styled.div`
  position: sticky;
  top: 0;
  z-index: ${zIndex.header + 1};
`;

const Banner = styled.div`
  display: flex;
  min-height: 40px;
  padding: env(safe-area-inset-top) 16px 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff4e0;
  color: #a65f00;
  font-size: 13px;
  font-weight: 600;
  box-sizing: border-box;
`;
