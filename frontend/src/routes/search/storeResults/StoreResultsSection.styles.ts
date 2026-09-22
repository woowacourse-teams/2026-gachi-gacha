import styled from '@emotion/styled';

export const Section = styled.section`
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 620px;
  grid-template-columns: minmax(400px, 56%) minmax(360px, 44%);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    'header map'
    'list map';
  background: var(--color-surface, #ffffff);

  @media (max-width: 767px) {
    position: relative;
    height: 100dvh;
    min-height: 100dvh;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'map';
  }
`;

export const ListHeaderArea = styled.div`
  min-width: 0;
  padding: 0 32px;
  grid-area: header;

  @media (max-width: 767px) {
    position: absolute;
    top: max(12px, env(safe-area-inset-top));
    right: 12px;
    left: 12px;
    z-index: 3;
    padding: 0;
    grid-area: auto;
  }
`;

export const ListArea = styled.div`
  min-width: 0;
  padding: 0 32px;
  grid-area: list;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 767px) {
    position: absolute;
    right: 0;
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 0;
    z-index: 2;
    padding: 0;
    grid-area: auto;
    overflow: visible;
  }
`;

export const MapArea = styled.div`
  min-width: 0;
  min-height: 0;
  padding: 16px;
  grid-area: map;
  background: var(--color-surface-muted, #faf9f8);

  @media (max-width: 767px) {
    padding: 0;
    background: var(--color-surface-muted, #f3f1ed);
  }
`;
