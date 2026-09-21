import styled from '@emotion/styled';

export const Page = styled.main`
  min-height: 100dvh;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #242122);
`;

export const PageTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const SearchToolbar = styled.div`
  position: sticky;
  z-index: 40;
  top: 0;
  display: flex;
  min-height: 76px;
  padding: 12px 32px;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border-subtle, #f0eeec);
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(12px);

  @media (max-width: 767px) {
    min-height: 64px;
    padding: 8px 16px;
  }
`;

export const SearchControl = styled.div`
  width: min(720px, 100%);
`;

export const SelectedGachaArea = styled.div`
  padding-top: 24px;

  @media (max-width: 767px) {
    padding-top: 16px;
  }
`;
