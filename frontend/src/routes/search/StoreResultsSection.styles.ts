import styled from '@emotion/styled';

export const Section = styled.section`
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 620px;
  grid-template-columns: minmax(400px, 56%) minmax(360px, 44%);
  background: var(--color-surface, #ffffff);

  @media (max-width: 767px) {
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(360px, 58svh) auto;
    grid-template-areas:
      'map'
      'list';
  }
`;

export const ListArea = styled.div`
  min-width: 0;
  padding: 0 32px;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 767px) {
    grid-area: list;
    padding: 0 20px;
    overflow: visible;
  }
`;

export const MapArea = styled.div`
  min-width: 0;
  min-height: 0;
  padding: 16px;
  background: var(--color-surface-muted, #faf9f8);

  @media (max-width: 767px) {
    grid-area: map;
    padding: 12px;
  }
`;
