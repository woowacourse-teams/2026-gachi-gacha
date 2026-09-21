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

export const SelectedGachaArea = styled.div`
  padding-top: 24px;

  @media (max-width: 767px) {
    padding-top: 16px;
  }
`;
