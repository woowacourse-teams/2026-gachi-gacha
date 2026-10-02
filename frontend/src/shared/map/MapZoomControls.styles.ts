import styled from '@emotion/styled';

export const ControlGroup = styled.div`
  display: grid;
  overflow: hidden;
  width: 46px;
  border: 1px solid rgb(36 33 34 / 12%);
  border-radius: 14px;
  background: var(--color-surface, #ffffff);
  box-shadow: 0 5px 16px rgb(36 33 34 / 14%);
`;

export const ZoomButton = styled.button`
  display: grid;
  width: 44px;
  height: 40px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--color-text, #242122);
  cursor: pointer;

  & + & {
    border-top: 1px solid rgb(36 33 34 / 10%);
  }

  &:hover {
    background: var(--color-primary-soft, #fbf0f2);
    color: var(--color-primary, #d93b54);
  }

  &:active {
    background: rgb(217 59 84 / 12%);
  }

  &:focus-visible {
    position: relative;
    z-index: 1;
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: -3px;
  }
`;

export const ZoomIcon = styled.svg`
  width: 19px;
  height: 19px;
`;
