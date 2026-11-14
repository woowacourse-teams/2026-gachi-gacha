import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';

export const Page = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: ${color.surface};
`;

export const Main = styled.main`
  width: min(100% - 40px, 920px);
  padding: clamp(${space.xxl}, 5vw, 64px) 0 80px;
  margin: 0 auto;

  @media (max-width: 520px) {
    width: min(100% - 24px, 920px);
    padding-top: ${space.xl};
  }
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  border-radius: ${radius.small};
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  gap: ${space.xxs};
  text-decoration: none;

  &:hover {
    color: ${color.primary};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const Header = styled.header`
  display: flex;
  margin-top: ${space.lg};
  align-items: flex-end;
  justify-content: space-between;
  gap: ${space.lg};

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    gap: ${space.md};
  }
`;

export const Heading = styled.h1`
  margin: 0;
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: ${lineHeight.tight};
`;

export const Description = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.body};
`;

export const TotalCount = styled.strong`
  flex: none;
  padding: ${space.xs} ${space.md};
  border-radius: ${radius.pill};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const FilterNav = styled.nav`
  overflow-x: auto;
  padding: ${space.xl} 0 ${space.sm};
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const FilterList = styled.div`
  display: flex;
  width: max-content;
  min-width: 100%;
  gap: ${space.xs};
`;

export const FilterButton = styled.button<{ $selected: boolean }>`
  min-height: 42px;
  padding: 0 ${space.md};
  border: 1px solid
    ${({ $selected }) => ($selected ? color.primary : color.border)};
  border-radius: ${radius.pill};
  background: ${({ $selected }) => ($selected ? color.primary : color.surface)};
  color: ${({ $selected }) => ($selected ? '#ffffff' : color.textMuted)};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  white-space: nowrap;

  &:hover {
    border-color: ${color.primary};
    color: ${({ $selected }) => ($selected ? '#ffffff' : color.primary)};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const ListCard = styled.section`
  padding: ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};

  @media (max-width: 520px) {
    padding: ${space.xs};
    border-radius: ${radius.card};
  }
`;

export const StatePanel = styled.div`
  display: grid;
  min-height: 280px;
  padding: ${space.xl};
  align-content: center;
  justify-items: center;
  border-radius: ${radius.card};
  background: ${color.surfaceMuted};
  text-align: center;
`;

export const StateTitle = styled.strong`
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.extraBold};
`;

export const StateDescription = styled.p`
  max-width: 420px;
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

const primaryActionStyles = `
  display: inline-flex;
  min-height: 44px;
  padding: 0 ${space.lg};
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: ${radius.pill};
  margin-top: ${space.lg};
  background: ${color.primary};
  color: #ffffff;
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-decoration: none;

  &:hover {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const CreateLink = styled(Link)`
  ${primaryActionStyles}
`;

export const RetryButton = styled.button`
  ${primaryActionStyles}
`;

export const PaginationArea = styled.div`
  display: grid;
  padding: ${space.lg} ${space.sm} ${space.sm};
  justify-items: center;
`;

export const LoadMoreButton = styled.button`
  min-width: 180px;
  min-height: 44px;
  padding: 0 ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};

  &:hover:not(:disabled) {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const LoadMoreError = styled.p`
  margin: 0 0 ${space.sm};
  color: #d80f42;
  font-size: ${fontSize.bodySmall};
  text-align: center;
`;
