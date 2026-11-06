import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/shared/styles/tokens';

export const FilterPanel = styled.section`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: var(--trade-grid-max-width);
  margin: 0 auto;
  padding: 0;
  align-items: center;
  justify-content: space-between;
  gap: ${space.lg};

  @media (max-width: ${breakpoint.mobile}) {
    gap: 8px;
  }
`;

export const CategoryFilter = styled.div`
  min-width: 0;
  flex: 1;
`;

export const FilterHeading = styled.h3`
  position: absolute;
  clip-path: inset(50%);
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.label};
  font-weight: ${fontWeight.bold};
`;

export const CategoryScroller = styled.div`
  display: flex;
  max-width: 100%;
  padding: 3px;
  overflow-x: auto;
  gap: ${space.xs};
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const CategoryButton = styled.button`
  min-height: 36px;
  padding: 0 ${space.md};
  flex: none;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;

  &[aria-pressed='true'] {
    border-color: ${color.primary};
    background: ${color.primary};
    color: ${color.surface};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

export const SelectFilters = styled.div`
  display: grid;
  flex: none;
  grid-template-columns: 135px 121px;
  gap: 8px;

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const SelectField = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${space.xs};

  [data-select-label] {
    display: none;
  }

  @media (min-width: 768px) {
    & > span {
      display: none;
    }

    [role='combobox'] {
      min-height: 40px;
      border-radius: 10px;
      padding-inline: 10px;
    }

    [data-select-label] {
      display: inline;
      flex-shrink: 0;
      color: ${color.textMuted};
      font-size: 13px;
    }

    [role='combobox'] > [aria-hidden='true']:last-child {
      width: 18px;
      height: 18px;
      background: transparent;
      color: ${color.textMuted};
    }
  }
`;

export const SelectLabelText = styled.span`
  color: ${color.textMuted};
  font-size: ${fontSize.label};
  font-weight: ${fontWeight.bold};
`;

export const DesktopSelectFilters = styled.div`
  @media (max-width: ${breakpoint.mobile}) {
    display: none;
  }
`;

export const MobileFilterButton = styled.button`
  display: none;

  @media (max-width: ${breakpoint.mobile}) {
    display: grid;
    width: 42px;
    height: 40px;
    flex: none;
    place-items: center;
    border: 1px solid ${color.border};
    border-radius: 10px;
    background: ${color.surface};
    color: ${color.text};
  }
`;

export const MobileFilterSheet = styled.dialog`
  position: fixed;
  inset: auto 0 0;
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
  overflow: visible;
  border: 0;
  border-radius: 20px 20px 0 0;
  background: ${color.surface};
  color: ${color.text};

  [role='listbox'] {
    top: auto;
    bottom: calc(100% + 4px);
  }

  &::backdrop {
    background: rgb(0 0 0 / 40%);
  }

  form {
    margin-top: 16px;
    text-align: right;
  }
`;
