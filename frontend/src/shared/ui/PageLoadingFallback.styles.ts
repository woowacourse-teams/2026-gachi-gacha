import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const fadeLogo = keyframes`
  0%, 100% {
    opacity: 0.28;
  }

  50% {
    opacity: 1;
  }
`;

export const LoadingScreen = styled.div`
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  background: var(--color-surface, #ffffff);
`;

export const LoadingLogo = styled.img`
  width: clamp(64px, 7vw, 84px);
  height: auto;
  opacity: 0.28;
  animation: ${fadeLogo} 1.35s ease-in-out infinite;
  object-fit: contain;

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.78;
    animation: none;
  }
`;

export const VisuallyHidden = styled.span`
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
