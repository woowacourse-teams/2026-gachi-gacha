import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  layout,
  letterSpacing,
  lineHeight,
  motion,
  radius,
  space,
} from '@/shared/styles/tokens';

const breathe = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.85; }
`;

export const Page = styled.div`
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  background: ${color.surface};
`;

export const Main = styled.main`
  width: min(calc(100% - ${space.xxxl}), ${layout.contentMaxWidth});
  padding: ${space.lg} 0 80px;
  margin: 0 auto;

  @media (max-width: ${breakpoint.compact}) {
    width: min(calc(100% - ${space.xxl}), ${layout.contentMaxWidth});
    padding-top: ${space.md};
  }
`;

export const LoadingArea = styled.div`
  display: grid;
  flex: 1;
  place-items: center;
`;

export const LoadingLogo = styled.img`
  width: clamp(64px, 8vw, 92px);
  height: auto;
  animation: ${breathe} ${motion.loading} ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.7;
    animation: none;
  }
`;

export const ErrorPanel = styled.section`
  display: flex;
  flex: 1;
  padding: ${space.huge} ${space.lg};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

export const ErrorTitle = styled.h1`
  margin: 0;
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  line-height: ${lineHeight.heading};
  letter-spacing: ${letterSpacing.title};
`;

export const ErrorDescription = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const RetryButton = styled.button`
  min-height: 46px;
  padding: 0 ${space.xl};
  border: 0;
  border-radius: ${radius.pill};
  margin-top: ${space.xxl};
  background: ${color.primary};
  color: ${color.surface};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.extraBold};

  &:hover {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;

export const VisuallyHidden = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  margin: -1px;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`;
