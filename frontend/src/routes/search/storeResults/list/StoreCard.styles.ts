import styled from '@emotion/styled';

import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Card = styled.article`
  border-bottom: 1px solid var(--color-border-subtle, #f0eeec);

  @media (max-width: 767px) {
    border: 0;
  }
`;

export const CardButton = styled.button<{ $isSelected: boolean }>`
  display: grid;
  width: 100%;
  padding: 12px 4px;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
  border: 0;
  border-radius: 8px;
  outline: ${({ $isSelected }) =>
    $isSelected ? '2px solid var(--color-primary, #d93b54)' : 'none'};
  outline-offset: -2px;
  background: ${({ $isSelected }) =>
    $isSelected ? 'var(--color-primary-soft, #fbf0f2)' : 'transparent'};
  color: var(--color-text, #242122);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected
        ? 'var(--color-primary-soft, #fbf0f2)'
        : 'var(--color-surface-muted, #faf9f8)'};
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    box-sizing: border-box;
    min-height: 104px;
    padding: 10px;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 12px;
    border: 1px solid rgb(36 33 34 / 9%);
    border-radius: 12px;
    background: ${({ $isSelected }) =>
      $isSelected
        ? 'var(--color-primary-soft, #fbf0f2)'
        : 'rgb(255 255 255 / 96%)'};
    box-shadow: 0 8px 24px rgb(36 33 34 / 14%);
    backdrop-filter: blur(8px);
  }
`;

export const ThumbnailFrame = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 8px;
  background: var(--color-primary-soft, #fbf0f2);

  @media (max-width: 767px) {
    align-self: start;
    aspect-ratio: 1;
    border-radius: 12px;
  }
`;

export const ThumbnailFallback = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
`;

export const Thumbnail = styled(ImageWithFallback)`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Information = styled.div`
  display: flex;
  min-width: 0;
  padding: 4px 8px 4px 0;
  flex-direction: column;
`;

export const Heading = styled.div`
  min-width: 0;
`;

export const StoreName = styled.h3`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.4;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: 767px) {
    font-size: 15px;
  }
`;

export const Address = styled.p`
  display: -webkit-box;
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--color-text-muted, #777173);
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: 767px) {
    margin-top: 5px;
    font-size: 12px;
    line-height: 1.4;
    -webkit-line-clamp: 1;
  }
`;

export const GachaCount = styled.p`
  margin: 4px 0 0;
  color: var(--color-text-muted, #777173);
  font-size: 12px;
  line-height: 1.45;

  @media (max-width: 767px) {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.4;
  }
`;

export const SelectionHint = styled.span`
  margin-top: auto;
  padding-top: 6px;
  color: var(--color-text-subtle, #969092);
  font-size: 12px;
  line-height: 1.4;

  @media (max-width: 767px) {
    display: none;
  }
`;
