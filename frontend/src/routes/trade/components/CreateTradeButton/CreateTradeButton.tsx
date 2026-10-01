import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  breakpoint,
  color,
  focusRing,
  shadow,
  zIndex,
} from '@/shared/styles/tokens';

const CREATE_TRADE_PATH = '/trade/new';

/**
 * 교환 탭 우측 하단에 고정되는 글 등록 버튼.
 * 비로그인 사용자는 /trade/new의 인증 경계가 로그인 후 등록 화면으로 돌려보낸다.
 */
export default function CreateTradeButton() {
  return (
    <FloatingLink to={CREATE_TRADE_PATH} aria-label="교환 글 등록">
      <PlusIcon aria-hidden="true" />
    </FloatingLink>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FloatingLink = styled(Link)`
  position: fixed;
  /* 헤더와 다이얼로그 오버레이보다 아래에 둔다. */
  z-index: ${zIndex.header - 10};
  right: max(24px, env(safe-area-inset-right));
  bottom: calc(24px + env(safe-area-inset-bottom));
  display: grid;
  width: 60px;
  height: 60px;
  place-items: center;
  border-radius: 50%;
  background: ${color.primary};
  box-shadow: ${shadow.card};
  color: #ffffff;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    background: ${color.primaryHover};
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing}, ${shadow.card};
  }

  @media (max-width: ${breakpoint.mobile}) {
    right: max(16px, env(safe-area-inset-right));
    bottom: calc(16px + env(safe-area-inset-bottom));
    width: 56px;
    height: 56px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;
