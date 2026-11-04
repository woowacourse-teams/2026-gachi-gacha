import { type CSSProperties, type SVGProps, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  breakpoint,
  color,
  focusRing,
  shadow,
  zIndex,
} from '@/shared/styles/tokens';
import { SITE_FOOTER_ID } from '@/shared/ui/SiteFooter';

import { floatingTradeActionSizeAndPosition } from '../floatingTradeAction.styles';

const CREATE_TRADE_PATH = '/trade/new';

type FooterAwareStyle = CSSProperties & {
  '--site-footer-overlap': string;
};

export function calculateSiteFooterOverlap(
  footerTop: number,
  viewportHeight: number,
) {
  return Math.max(0, viewportHeight - footerTop);
}

function useSiteFooterOverlap() {
  const [footerOverlap, setFooterOverlap] = useState(0);

  useEffect(() => {
    const footer = document.getElementById(SITE_FOOTER_ID);

    if (!footer) {
      return;
    }

    let animationFrameId = 0;
    let isUpdateScheduled = false;

    const updateFooterOverlap = () => {
      const nextOverlap = calculateSiteFooterOverlap(
        footer.getBoundingClientRect().top,
        window.innerHeight,
      );

      setFooterOverlap((currentOverlap) =>
        currentOverlap === nextOverlap ? currentOverlap : nextOverlap,
      );
    };

    const scheduleUpdate = () => {
      if (isUpdateScheduled) {
        return;
      }

      isUpdateScheduled = true;
      animationFrameId = window.requestAnimationFrame(() => {
        isUpdateScheduled = false;
        updateFooterOverlap();
      });
    };

    updateFooterOverlap();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(footer);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();

      if (isUpdateScheduled) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return footerOverlap;
}

/**
 * 교환 탭 우측 하단에 고정되는 글 등록 버튼.
 * 비로그인 사용자는 /trade/new의 인증 경계가 로그인 후 등록 화면으로 돌려보낸다.
 */
export default function CreateTradeButton() {
  const footerOverlap = useSiteFooterOverlap();
  const footerAwareStyle: FooterAwareStyle = {
    '--site-footer-overlap': `${footerOverlap}px`,
  };

  return (
    <FloatingLink
      to={CREATE_TRADE_PATH}
      aria-label="교환 글 등록"
      style={footerAwareStyle}
      onClick={() =>
        captureAnalyticsEvent('trade_create_started', {
          source: 'floating_button',
        })
      }
    >
      <PlusIcon aria-hidden="true" />
    </FloatingLink>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
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
  ${floatingTradeActionSizeAndPosition};

  position: fixed;
  /* 헤더와 다이얼로그 오버레이보다 아래에 둔다. */
  z-index: ${zIndex.header - 10};
  bottom: calc(24px + env(safe-area-inset-bottom) + var(--site-footer-overlap));
  display: grid;
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
    bottom: calc(
      16px + env(safe-area-inset-bottom) + var(--site-footer-overlap)
    );
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;
