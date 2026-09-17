import styled from '@emotion/styled';

export const Popover = styled.section`
  position: absolute;
  z-index: 30;
  top: calc(100% + 12px);
  left: 50%;
  display: flex;
  width: min(960px, calc(100vw - 40px));
  max-height: min(680px, calc(100vh - 120px));
  overflow: hidden;
  transform: translateX(-50%);
  flex-direction: column;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 24px;
  background: var(--color-surface, #ffffff);
  box-shadow: 0 18px 50px rgb(35 31 32 / 14%);
  color: var(--color-text, #242122);

  @media (max-width: 767px) {
    position: fixed;
    inset: auto 0 0;
    width: auto;
    max-height: 82dvh;
    transform: none;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -14px 42px rgb(35 31 32 / 16%);
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--color-border-subtle, #f0eeec);

  @media (max-width: 767px) {
    padding: 22px 20px 18px;
  }
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.35;
  letter-spacing: -0.02em;
`;

export const HelperText = styled.p`
  margin: 6px 0 0;
  color: var(--color-text-muted, #777173);
  font-size: 14px;
  line-height: 1.5;

  @media (max-width: 767px) {
    padding-right: 8px;
  }
`;

export const CloseButton = styled.button`
  display: inline-grid;
  width: 36px;
  height: 36px;
  padding: 0;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 50%;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #242122);
  font: inherit;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary, #d93b54);
    color: var(--color-primary, #d93b54);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const Content = styled.div`
  min-height: 260px;
  padding: 20px 28px 28px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;

  @media (max-width: 767px) {
    padding: 18px 20px 28px;
  }
`;

export const ResultSummary = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 700;
`;

export const ResultCount = styled.span`
  color: var(--color-primary, #d93b54);
  font-variant-numeric: tabular-nums;
`;

export const ProductList = styled.ul`
  display: grid;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px 16px;
  align-items: start;
  list-style: none;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 767px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 12px;
  }
`;

export const ProductItem = styled.li`
  min-width: 0;
`;

export const ProductButton = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover > div:first-of-type {
    border-color: var(--color-primary, #d93b54);
    transform: translateY(-2px);
    box-shadow: 0 9px 20px rgb(35 31 32 / 12%);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 4px;
    border-radius: 14px;
  }
`;

export const ProductImageFrame = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 14px;
  background: var(--color-primary-soft, #fbf0f2);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
`;

export const ImageFallback = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-primary, #d93b54);
  font-size: 34px;
  font-weight: 800;
  opacity: 0.45;
`;

export const ProductImage = styled.img`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ProductName = styled.strong`
  display: -webkit-box;
  height: 44px;
  margin-top: 10px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const CategoryText = styled.span`
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: var(--color-text-muted, #827c7e);
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const EmptyState = styled.div`
  display: flex;
  min-height: 250px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  color: var(--color-text-muted, #777173);
  font-size: 15px;
  text-align: center;
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: var(--color-danger, #b72e3f);
`;

export const RetryButton = styled.button`
  padding: 10px 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary, #d93b54);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-hover, #c73149);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px 16px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 767px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 12px;
  }
`;

export const LoadingCard = styled.div`
  min-height: 190px;
  border-radius: 14px;
  background: linear-gradient(100deg, #f2f0ee 20%, #faf9f8 38%, #f2f0ee 56%);
  background-size: 220% 100%;
  animation: shimmer 1.4s ease-in-out infinite;

  @keyframes shimmer {
    to {
      background-position-x: -220%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const LoadMoreStatus = styled.p`
  margin: 22px 0 0;
  color: var(--color-text-muted, #777173);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
`;

export const LoadMoreError = styled.div`
  display: flex;
  margin-top: 22px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  text-align: center;
`;
