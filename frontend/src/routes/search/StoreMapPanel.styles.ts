import styled from '@emotion/styled';

export const Panel = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;

  @media (max-width: 768px) {
    min-height: 360px;
  }
`;

export const SearchAreaButton = styled.button`
  position: absolute;
  top: 18px;
  left: 50%;
  z-index: 3;
  display: inline-flex;
  min-height: 44px;
  padding: 0 18px;
  align-items: center;
  gap: 8px;
  border: 1px solid rgb(36 33 34 / 10%);
  border-radius: 999px;
  background: var(--color-surface, #ffffff);
  box-shadow: 0 6px 18px rgb(36 33 34 / 16%);
  color: var(--color-text, #242122);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  transform: translateX(-50%);
  cursor: pointer;

  &:hover {
    color: var(--color-primary, #d93b54);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const RefreshIcon = styled.svg`
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
`;
