import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const pulse = keyframes`
  0%, 100% {
    opacity: 0.45;
    transform: scale(0.88);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const MapFrame = styled.section`
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 360px;
  height: 100%;
  border-radius: 20px;
  background: var(--color-surface-muted, #f3f1ed);
`;

export const MapCanvas = styled.div`
  position: absolute;
  inset: 0;
`;

export const StatusLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgb(243 241 237 / 88%);
  color: var(--color-text-muted, #777173);
  text-align: center;
`;

export const StatusContent = styled.div`
  display: grid;
  max-width: 320px;
  justify-items: center;
  gap: 14px;
`;

export const LoadingDot = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary, #d93b54);
  animation: ${pulse} 1.1s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StatusMessage = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
`;

export const RetryButton = styled.button`
  min-height: 40px;
  padding: 0 18px;
  border: 1px solid var(--color-primary, #d93b54);
  border-radius: 999px;
  background: var(--color-surface, #ffffff);
  color: var(--color-primary, #d93b54);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-soft, #fbf0f2);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;
