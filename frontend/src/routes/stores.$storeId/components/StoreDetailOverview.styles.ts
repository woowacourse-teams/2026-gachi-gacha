import styled from '@emotion/styled';

import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Heading = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

export const HeadingCopy = styled.div`
  min-width: 0;
`;

export const Eyebrow = styled.p`
  margin: 0 0 8px;
  color: var(--color-primary, #d93b54);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1.2;
  letter-spacing: -0.045em;
`;

export const Address = styled.p`
  margin: 10px 0 0;
  color: var(--color-text-muted, #696466);
  font-size: 15px;
  line-height: 1.5;
`;

export const Gallery = styled.section<{ $isSingle: boolean }>`
  display: grid;
  height: clamp(360px, 42vw, 520px);
  margin-top: 28px;
  grid-template-columns: ${({ $isSingle }) =>
    $isSingle ? 'minmax(0, 1fr)' : 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))'};
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 767px) {
    height: auto;
    padding-bottom: 4px;
    overflow-x: auto;
    grid-auto-columns: 86%;
    grid-auto-flow: column;
    grid-template-columns: 86%;
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
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 16px;
  background: var(--color-surface-muted, #faf9f8);
  place-items: center;

  ${({ $isMain }) =>
    $isMain
      ? `
        grid-column: 1;
        grid-row: 1 / 3;
      `
      : ''}

  @media (max-width: 767px) {
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

export const EmptyGalleryLabel = styled.span`
  position: absolute;
  bottom: 18%;
  color: var(--color-text-muted, #696466);
  font-size: 14px;
  font-weight: 700;
`;
