import styled from '@emotion/styled';

export const Section = styled.section`
  display: grid;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    'header map'
    'list map';
  background: var(--color-surface, #ffffff);

  @media (max-width: 767px) {
    position: relative;
    height: 100%;
    min-height: 0;
    flex: none;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'map';
  }
`;

export const ListHeaderArea = styled.div`
  min-width: 0;
  padding: 0 16px;
  grid-area: header;

  @media (max-width: 767px) {
    position: absolute;
    top: calc(64px + env(safe-area-inset-top));
    right: auto;
    left: 12px;
    z-index: 3;
    padding: 0 12px;
    border: 1px solid #e7e4e2;
    border-radius: 999px;
    background: #fff;
    grid-area: auto;
    transition: top 240ms ease;
  }

  @media (max-width: 767px) and (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ListArea = styled.div`
  min-width: 0;
  min-height: 0;
  padding: 0 16px 24px;
  grid-area: list;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;

  @media (max-width: 767px) {
    position: absolute;
    right: 0;
    bottom: calc(78px + env(safe-area-inset-bottom));
    left: 0;
    z-index: 2;
    padding: 0;
    grid-area: auto;
    overflow: visible;
    scrollbar-gutter: auto;
  }
`;

export const MapArea = styled.div`
  min-width: 0;
  min-height: 0;
  padding: 0;
  grid-area: map;
  background: var(--color-surface-muted, #faf9f8);

  > div > section {
    box-sizing: border-box;
    min-height: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  @media (max-width: 767px) {
    padding: 0;
    background: var(--color-surface-muted, #f3f1ed);
  }
`;
