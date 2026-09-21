import styled from '@emotion/styled';

export const SearchRoot = styled.div`
  position: relative;
  width: 100%;
`;

export const SearchForm = styled.form`
  display: flex;
  width: 100%;
  min-height: 52px;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 18px;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 16px;
  background: var(--color-surface, #ffffff);
  box-shadow: 0 6px 18px rgb(35 31 32 / 6%);

  &:focus-within {
    border-color: var(--color-primary, #d93b54);
    box-shadow: 0 0 0 3px rgb(217 59 84 / 12%);
  }

  @media (max-width: 767px) {
    min-height: 48px;
    padding-left: 14px;
    border-radius: 14px;
  }
`;

export const SearchIcon = styled.svg`
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  color: var(--color-text-muted, #777173);
`;

export const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text, #242122);
  font: inherit;
  font-size: 15px;
  line-height: 1.5;

  &::placeholder {
    color: var(--color-text-subtle, #969092);
  }

  &::-webkit-search-cancel-button {
    cursor: pointer;
  }
`;

export const SubmitButton = styled.button`
  min-width: 72px;
  align-self: stretch;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: var(--color-primary, #d93b54);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-hover, #c73149);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }

  @media (max-width: 767px) {
    min-width: 58px;
    padding: 0 14px;
  }
`;
