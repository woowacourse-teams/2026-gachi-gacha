import styled from '@emotion/styled';

import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  display: grid;
  padding: 24px;
  background: rgb(20 18 19 / 78%);
  inset: 0;
  place-items: center;

  @media (max-width: 767px) {
    padding: 0;
  }
`;

export const Dialog = styled.section`
  display: grid;
  width: min(1120px, 100%);
  height: min(780px, calc(100dvh - 48px));
  overflow: hidden;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 24px 80px rgb(0 0 0 / 32%);
  grid-template-rows: auto minmax(0, 1fr) auto;

  @media (max-width: 767px) {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
  }
`;

export const TopBar = styled.header`
  display: grid;
  min-height: 64px;
  padding: 10px 14px 10px 20px;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e8e6e3);
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 16px;
`;

export const Title = styled.h2`
  overflow: hidden;
  margin: 0;
  font-size: 17px;
  letter-spacing: -0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Counter = styled.p`
  margin: 0;
  color: var(--color-text-muted, #696466);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
`;

export const CloseButton = styled.button`
  display: grid;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 50%;
  background: #ffffff;
  color: var(--color-text, #242122);
  cursor: pointer;
  place-items: center;

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-width: 1.8;
  }

  &:hover {
    background: var(--color-surface-muted, #faf9f8);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const Viewer = styled.div`
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #181617;
`;

export const Rail = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    scroll-behavior: auto;
  }
`;

export const Slide = styled.div`
  position: relative;
  display: grid;
  flex: 0 0 100%;
  min-width: 0;
  padding: 24px 72px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  place-items: center;

  @media (max-width: 767px) {
    padding: 16px 44px;
  }
`;

export const Photo = styled(ImageWithFallback)`
  position: absolute;
  z-index: 1;
  display: block;
  max-width: calc(100% - 144px);
  max-height: calc(100% - 48px);
  object-fit: contain;

  @media (max-width: 767px) {
    max-width: calc(100% - 88px);
    max-height: calc(100% - 32px);
  }
`;

export const DirectionButton = styled.button<{
  $direction: 'previous' | 'next';
}>`
  position: absolute;
  z-index: 2;
  top: 50%;
  ${({ $direction }) => ($direction === 'previous' ? 'left: 16px;' : 'right: 16px;')}
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: 50%;
  background: rgb(255 255 255 / 90%);
  color: #242122;
  cursor: pointer;
  place-items: center;
  transform: translateY(-50%);

  &:disabled {
    opacity: 0.32;
    cursor: default;
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 38%);
    outline-offset: 2px;
  }

  svg {
    width: 19px;
    height: 19px;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  @media (max-width: 767px) {
    ${({ $direction }) =>
      $direction === 'previous' ? 'left: 8px;' : 'right: 8px;'}
    width: 38px;
    height: 38px;
  }
`;

export const ThumbnailList = styled.div`
  display: flex;
  min-height: 86px;
  padding: 12px 16px max(12px, env(safe-area-inset-bottom));
  gap: 9px;
  overflow-x: auto;
  border-top: 1px solid var(--color-border, #e8e6e3);
  scrollbar-width: thin;
`;

export const ThumbnailButton = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: grid;
  width: 62px;
  height: 62px;
  padding: 0;
  overflow: hidden;
  flex: 0 0 auto;
  border: 2px solid
    ${({ $isActive }) =>
      $isActive ? 'var(--color-primary, #d93b54)' : 'transparent'};
  border-radius: 10px;
  background: var(--color-surface-muted, #faf9f8);
  cursor: pointer;
  place-items: center;

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const ThumbnailPhoto = styled(ImageWithFallback)`
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  inset: 0;
  object-fit: cover;
`;
