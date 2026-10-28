import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Heading = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${space.xl};
`;

export const HeadingCopy = styled.div`
  min-width: 0;
`;

export const Title = styled.h1`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.display};
  font-weight: ${fontWeight.extraBold};
  line-height: ${lineHeight.tight};
  letter-spacing: ${letterSpacing.title};
  word-break: keep-all;
`;

export const Address = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.body};
`;

export const Gallery = styled.section<{ $isSingle: boolean }>`
  display: grid;
  height: clamp(360px, 42vw, 520px);
  margin-top: ${space.xxl};
  grid-template-columns: ${({ $isSingle }) =>
    $isSingle ? 'minmax(0, 1fr)' : 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))'};
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: ${space.xs};

  @media (max-width: ${breakpoint.mobile}) {
    height: auto;
    padding-bottom: ${space.xxs};
    overflow-x: auto;
    grid-auto-columns: 100%;
    grid-auto-flow: column;
    grid-template-columns: 100%;
    grid-template-rows: 260px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const GalleryFrame = styled.div<{ $isMain?: boolean }>`
  position: relative;
  display: grid;
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surfaceMuted};
  place-items: center;

  ${({ $isMain }) =>
    $isMain
      ? `
        grid-column: 1;
        grid-row: 1 / 3;
      `
      : ''}

  @media (max-width: ${breakpoint.mobile}) {
    grid-column: auto;
    grid-row: auto;
    scroll-snap-align: center;
  }
`;

export const GalleryImage = styled(ImageWithFallback)`
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  inset: 0;
  object-fit: cover;
`;

export const GalleryOpenButton = styled.button`
  position: absolute;
  z-index: 2;
  display: flex;
  padding: ${space.sm};
  align-items: flex-end;
  justify-content: flex-end;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  inset: 0;

  &:focus-visible {
    outline: none;
    outline-offset: -4px;
    box-shadow: inset ${focusRing};
  }
`;

export const PhotoCountBadge = styled.span`
  display: inline-flex;
  min-height: 38px;
  padding: 0 ${space.sm};
  align-items: center;
  border: 1px solid color-mix(in srgb, ${color.text} 13%, transparent);
  border-radius: ${radius.pill};
  background: rgb(255 255 255 / 92%);
  box-shadow: ${shadow.float};
  color: ${color.text};
  font-size: ${fontSize.label};
  font-weight: ${fontWeight.extraBold};
  backdrop-filter: blur(8px);
`;

export const EmptyGalleryLabel = styled.span`
  position: absolute;
  bottom: 18%;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;
