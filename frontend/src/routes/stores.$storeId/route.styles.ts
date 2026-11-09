import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  color,
  focusRing,
  fontSize,
  fontWeight,
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

export const DesktopHeader = styled.div`
  display: contents;
  @media (max-width: 767px) {
    display: none;
  }
`;
export const MobileHeader = styled.header`
  display: none;
  @media (max-width: 767px) {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    min-height: 48px;
    align-items: center;
    padding: 0 8px;
    background: white;
  }
`;
export const BackLink = styled(Link)`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: inherit;
  &:focus-visible {
    outline: 3px solid ${color.primary};
  }
`;
export const Main = styled.main`
  box-sizing: border-box;
  width: min(100%, 1280px);
  padding: 40px 40px 64px;
  margin: 0 auto;
  @media (max-width: 767px) {
    padding: 0 0 32px;
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
