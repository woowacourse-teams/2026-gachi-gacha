import styled from '@emotion/styled';

import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  motion,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';

export const SelectRoot = styled.div`
  position: relative;
  min-width: 0;
`;

export const SelectTrigger = styled.button`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 0 ${space.xs} 0 ${space.sm};
  align-items: center;
  justify-content: space-between;
  gap: ${space.xs};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  text-align: left;
  transition:
    border-color ${motion.fast} ease,
    background-color ${motion.fast} ease,
    box-shadow ${motion.fast} ease;

  &:hover {
    border-color: ${color.textSubtle};
    background: ${color.surfaceMuted};
  }

  &[aria-expanded='true'] {
    border-color: ${color.primary};
    background: ${color.surface};
    box-shadow: ${focusRing};
  }

  &:focus-visible {
    border-color: ${color.primary};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const SelectedValue = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChevronBadge = styled.span`
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: ${radius.circle};
  background: ${color.primarySoft};
  color: ${color.primary};
`;

export const Chevron = styled.span`
  width: 6px;
  height: 6px;
  transform: translateY(-2px) rotate(45deg);
  border-right: 2px solid currentcolor;
  border-bottom: 2px solid currentcolor;
  transition: transform ${motion.fast} ease;

  [aria-expanded='true'] & {
    transform: translateY(2px) rotate(225deg);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Options = styled.ul`
  position: absolute;
  z-index: 30;
  top: calc(100% + ${space.xs});
  left: 0;
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 6px;
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};
  box-shadow: ${shadow.popover};
  list-style: none;
`;

export const Option = styled.li`
  display: flex;
  min-height: 40px;
  padding: 0 6px;
  align-items: center;
  justify-content: space-between;
  gap: ${space.sm};
  border-radius: 11px;
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  transition:
    background-color ${motion.fast} ease,
    color ${motion.fast} ease;

  & > span:first-of-type {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &[data-active='true'] {
    background: ${color.surfaceMuted};
  }

  &[aria-selected='true'] {
    background: ${color.primarySoft};
    color: ${color.primary};
    font-weight: ${fontWeight.bold};
  }

  &[aria-selected='true'][data-active='true'] {
    box-shadow: inset 0 0 0 1px ${color.primary};
  }
`;

export const SelectedMark = styled.span`
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: ${radius.circle};
  background: ${color.primary};
  color: ${color.surface};
  font-size: 12px;
  font-weight: ${fontWeight.extraBold};
`;
