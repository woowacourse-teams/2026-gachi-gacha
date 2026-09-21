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
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(360px, 58svh) auto;
    grid-template-areas:
      'header'
      'map'
      'list';
  }
`;

export const ListHeaderArea = styled.div`
  min-width: 0;
  padding: 0 32px;
  grid-area: header;

  @media (max-width: 767px) {
    padding: 0 20px;
  }
`;

export const ListArea = styled.div`
  min-width: 0;
  padding: 0 32px;
  grid-area: list;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 767px) {
    z-index: 2;
    padding: 0 0 max(16px, env(safe-area-inset-bottom));
    margin-top: -190px;
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
    padding: 12px;
  }
`;
