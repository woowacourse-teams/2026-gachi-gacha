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
  padding: ${space.md};
  align-items: flex-end;
  justify-content: space-between;
  gap: ${space.lg};
  border: 1px solid ${color.borderSubtle};
  border-radius: ${radius.card};
  background: ${color.surfaceMuted};

  @media (max-width: ${breakpoint.mobile}) {
    align-items: stretch;
    flex-direction: column;
    gap: ${space.md};
  }
`;

export const CategoryFilter = styled.div`
  min-width: 0;
  flex: 1;
`;

export const FilterHeading = styled.h3`
  margin: 0 0 ${space.sm};
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
  min-height: 40px;
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
  grid-template-columns: repeat(2, minmax(132px, 160px));
  gap: ${space.sm};

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const SelectLabel = styled.label`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${space.xs};
`;

export const SelectLabelText = styled.span`
  color: ${color.textMuted};
  font-size: ${fontSize.label};
  font-weight: ${fontWeight.bold};
`;

export const Select = styled.select`
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 0 ${space.sm};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  cursor: pointer;

  &:focus-visible {
    outline: none;
    border-color: ${color.primary};
    box-shadow: ${focusRing};
  }
`;
