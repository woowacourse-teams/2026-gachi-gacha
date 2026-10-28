import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const pulse = keyframes`
  0%, 100% {
    opacity: 0.55;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const Button = styled.button`
  display: grid;
  width: 46px;
  height: 46px;
  padding: 0;
  place-items: center;
  border: 1px solid rgb(36 33 34 / 12%);
  border-radius: 14px;
  background: var(--color-surface, #ffffff);
  box-shadow: 0 5px 16px rgb(36 33 34 / 14%);
  color: var(--color-text, #242122);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-surface-muted, #faf9f8);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgb(54 125 232 / 28%);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
  }
`;

export const Icon = styled.svg<{ $isLocating: boolean }>`
  width: 22px;
  height: 22px;
  animation: ${({ $isLocating }) => ($isLocating ? pulse : 'none')} 1s
    ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
