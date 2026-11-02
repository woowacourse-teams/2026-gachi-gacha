import { useEffect, useState } from 'react';
import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  shadow,
  zIndex,
} from '@/shared/styles/tokens';

import { floatingTradeActionSizeAndPosition } from '../floatingTradeAction.styles';

const VISIBILITY_THRESHOLD = 480;

/** 거래 목록을 충분히 탐색한 뒤 화면 우측 상단에 나타나는 최상단 이동 버튼. */
export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY >= VISIBILITY_THRESHOLD);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <FloatingButton
      type="button"
      aria-label="맨 위로 이동"
      onClick={scrollToTop}
    >
      <ArrowUpIcon aria-hidden="true" />
    </FloatingButton>
  );
}

function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" {...props}>
      <path
        d="m6 14 6-6 6 6M12 8v10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FloatingButton = styled.button`
  ${floatingTradeActionSizeAndPosition};

  --app-header-height: 78px;

  position: fixed;
  z-index: ${zIndex.header - 10};
  /* 헤더 아래 여백과 우측 여백은 같은 edge offset을 공유한다. */
  top: calc(
    var(--app-header-height) + var(--trade-floating-edge-offset) +
      env(safe-area-inset-top)
  );
  display: grid;
  padding: 0;
  place-items: center;
  border: 1px solid ${color.border};
  border-radius: 50%;
  background: ${color.surface};
  box-shadow: ${shadow.card};
  color: ${color.primary};
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: ${color.primary};
    background: ${color.primarySoft};
    transform: translateY(-2px);
  }

  &:focus-visible {
    border-color: ${color.primary};
    outline: none;
    box-shadow: ${focusRing}, ${shadow.card};
  }

  @media (max-width: 1180px) {
    --app-header-height: 64px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    top: max(var(--trade-floating-edge-offset), env(safe-area-inset-top));
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;
