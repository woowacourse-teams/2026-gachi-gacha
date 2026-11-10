import styled from '@emotion/styled';

import { color, focusRing } from '@/shared/styles/tokens';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Overview = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 600fr) minmax(0, 544fr);
  grid-template-areas: 'gallery heading' 'gallery visit' 'gallery prices' 'gallery updated' 'catalog catalog';
  column-gap: 56px;
  align-items: start;

  @media (max-width: 1000px) and (min-width: 768px) {
    column-gap: 32px;
  }
  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    gap: 0;
    & > * {
      width: 100%;
      box-sizing: border-box;
    }
  }
`;

export const Heading = styled.header`
  grid-area: heading;
  min-width: 0;
  @media (max-width: 767px) {
    padding: 20px 24px;
  }
`;
export const HeadingCopy = styled.div`
  min-width: 0;
`;
export const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
  @media (max-width: 767px) {
    font-size: 24px;
  }
`;
export const Address = styled.p`
  margin: 6px 0 0;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

export const Gallery = styled.section`
  position: relative;
  grid-area: gallery;
  min-width: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
  background: ${color.surfaceMuted};
  @media (max-width: 767px) {
    border-radius: 0;
  }
`;
export const GalleryTrack = styled.div`
  display: flex;
  height: 440px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  &:focus-visible {
    outline: 3px solid ${color.primary};
    outline-offset: -3px;
  }
  @media (max-width: 767px) {
    height: auto;
    aspect-ratio: 39 / 28;
  }
`;
export const GalleryFrame = styled.div`
  position: relative;
  display: grid;
  min-width: 0;
  height: 100%;
  flex: 0 0 100%;
  overflow: hidden;
  place-items: center;
  scroll-snap-align: start;
`;
export const GalleryImage = styled(ImageWithFallback)`
  position: absolute;
  width: 100%;
  height: 100%;
  inset: 0;
  object-fit: cover;
`;
export const GalleryOpenButton = styled.button`
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  &:focus-visible {
    outline: 3px solid ${color.primary};
    outline-offset: -3px;
  }
`;
export const PhotoCountBadge = styled.span`
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgb(0 0 0 / 56%);
  color: white;
  font-size: 12px;
  pointer-events: none;
`;
export const GalleryNavigation = styled.div`
  position: absolute;
  inset: 50% 12px auto;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  pointer-events: none;
  button {
    display: grid;
    width: 40px;
    height: 40px;
    padding: 0;
    place-items: center;
    border: 1px solid ${color.border};
    border-radius: 50%;
    background: rgb(255 255 255 / 92%);
    color: ${color.text};
    cursor: pointer;
    pointer-events: auto;
    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
    &:focus-visible {
      outline: none;
      box-shadow: ${focusRing};
    }
  }
`;
export const EmptyGalleryLabel = styled.span`
  position: absolute;
  bottom: 20%;
  color: ${color.textMuted};
  font-size: 14px;
`;
