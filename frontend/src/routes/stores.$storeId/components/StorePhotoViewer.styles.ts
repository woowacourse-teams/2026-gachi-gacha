import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  radius,
  shadow,
  space,
  zIndex,
} from '@/shared/styles/tokens';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Backdrop = styled.div`
  position: fixed;
  z-index: ${zIndex.overlay};
  display: grid;
  padding: ${space.xl};
  background: rgb(20 18 19 / 78%);
  inset: 0;
  place-items: center;

  @media (max-width: ${breakpoint.mobile}) {
    padding: 0;
  }
`;

export const Dialog = styled.section`
  display: grid;
  width: min(1120px, 100%);
  height: min(780px, calc(100dvh - ${space.huge}));
  overflow: hidden;
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.dialog};
  grid-template-rows: auto minmax(0, 1fr) auto;

  @media (max-width: ${breakpoint.mobile}) {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
  }
`;

export const TopBar = styled.header`
  display: grid;
  min-height: 64px;
  padding: ${space.xs} ${space.sm} ${space.xs} ${space.lg};
  align-items: center;
  border-bottom: 1px solid ${color.border};
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: ${space.md};
`;

export const Title = styled.h2`
  overflow: hidden;
  margin: 0;
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};
  letter-spacing: ${letterSpacing.heading};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Counter = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-variant-numeric: tabular-nums;
`;

export const CloseButton = styled.button`
  display: grid;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid ${color.border};
  border-radius: ${radius.circle};
  background: ${color.surface};
  color: ${color.text};
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
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
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
  padding: ${space.xl} 72px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  place-items: center;

  @media (max-width: ${breakpoint.mobile}) {
    padding: ${space.md} 44px;
  }
`;

export const Photo = styled(ImageWithFallback)`
  position: absolute;
  z-index: 1;
  display: block;
  max-width: calc(100% - 144px);
  max-height: calc(100% - 48px);
  object-fit: contain;

  @media (max-width: ${breakpoint.mobile}) {
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
  border-radius: ${radius.circle};
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
    outline: none;
    box-shadow: ${focusRing};
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

  @media (max-width: ${breakpoint.mobile}) {
    ${({ $direction }) =>
      $direction === 'previous' ? 'left: 8px;' : 'right: 8px;'}
    width: 38px;
    height: 38px;
  }
`;

export const ThumbnailList = styled.div`
  display: flex;
  min-height: 86px;
  padding: ${space.sm} ${space.md} max(${space.sm}, env(safe-area-inset-bottom));
  gap: 9px;
  overflow-x: auto;
  border-top: 1px solid ${color.border};
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
    ${({ $isActive }) => ($isActive ? color.primary : 'transparent')};
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  cursor: pointer;
  place-items: center;

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
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
