import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const breathe = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.85; }
`;

export const Page = styled.div`
  min-height: 100dvh;
  background: var(--color-surface, #ffffff);
`;

export const Main = styled.main`
  width: min(100% - 40px, 1280px);
  padding: clamp(36px, 5vw, 72px) 0 80px;
  margin: 0 auto;

  @media (max-width: 520px) {
    width: min(100% - 28px, 1280px);
    padding-top: 28px;
  }
`;

export const LoadingArea = styled.div`
  display: grid;
  min-height: min(620px, calc(100dvh - 100px));
  place-items: center;
`;

export const LoadingLogo = styled.img`
  width: clamp(64px, 8vw, 92px);
  height: auto;
  animation: ${breathe} 1.35s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.7;
    animation: none;
  }
`;

export const ErrorPanel = styled.section`
  display: flex;
  min-height: min(560px, calc(100dvh - 140px));
  padding: 48px 20px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

export const ErrorTitle = styled.h1`
  margin: 0;
  font-size: clamp(24px, 4vw, 34px);
  letter-spacing: -0.035em;
`;

export const ErrorDescription = styled.p`
  margin: 14px 0 0;
  color: var(--color-text-muted, #696466);
  line-height: 1.6;
`;

export const RetryButton = styled.button`
  min-height: 46px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  margin-top: 28px;
  background: var(--color-primary, #d93b54);
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    background: var(--color-primary-hover, #c73149);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 3px;
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
