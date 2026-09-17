import styled from '@emotion/styled';

export const Card = styled.article`
  border-bottom: 1px solid var(--color-border-subtle, #f0eeec);
`;

export const CardButton = styled.button<{ $isSelected: boolean }>`
  display: grid;
  width: 100%;
  padding: 20px 0;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 20px;
  border: 0;
  border-radius: 16px;
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
    padding: 16px 0;
    grid-template-columns: 116px minmax(0, 1fr);
    gap: 14px;
  }
`;

export const ThumbnailFrame = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 14px;
  background: var(--color-primary-soft, #fbf0f2);
`;

export const ThumbnailFallback = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-primary, #d93b54);
  font-size: 34px;
  font-weight: 800;
  opacity: 0.45;
`;

export const Thumbnail = styled.img`
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const StoreName = styled.h3`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 19px;
  font-weight: 750;
  line-height: 1.4;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: 767px) {
    font-size: 16px;
  }
`;

export const Distance = styled.span`
  flex: 0 0 auto;
  color: var(--color-primary, #d93b54);
  font-size: 13px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
`;

export const Address = styled.p`
  display: -webkit-box;
  margin: 10px 0 0;
  overflow: hidden;
  color: var(--color-text-muted, #777173);
  font-size: 14px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const SelectionHint = styled.span`
  margin-top: auto;
  padding-top: 12px;
  color: var(--color-text-subtle, #969092);
  font-size: 12px;
  line-height: 1.4;
`;
