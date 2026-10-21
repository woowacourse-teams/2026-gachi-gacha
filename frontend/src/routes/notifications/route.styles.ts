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
  background: #fffaf8;
`;

export const Main = styled.main`
  width: min(100% - 40px, 820px);
  padding: ${space.xl} 0 96px;
  margin: 0 auto;

  @media (max-width: 520px) {
    width: min(100% - 24px, 820px);
  }
`;

export const HeadingArea = styled.header`
  display: flex;
  margin: ${space.xl} 0 ${space.lg};
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
  font-size: clamp(32px, 6vw, 44px);
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
`;

export const PageDescription = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${space.sm};
`;

export const UnreadBadge = styled.span`
  padding: 7px 11px;
  border-radius: ${radius.pill};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

export const MarkAllButton = styled.button`
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:disabled {
    color: ${color.textSubtle};
    cursor: not-allowed;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const ListCard = styled.section`
  overflow: hidden;
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
`;

export const List = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;

  & > li + li {
    border-top: 1px solid ${color.borderSubtle};
  }
`;

export const ItemLink = styled(Link, {
  shouldForwardProp: (property) => property !== '$unread',
})<{ $unread: boolean }>`
  display: block;
  padding: clamp(${space.md}, 4vw, ${space.lg});
  background: ${({ $unread }) => ($unread ? '#fff9fa' : color.surface)};
  color: inherit;
  text-decoration: none;

  &:hover {
    background: #f8f6f4;
  }

  &:focus-visible {
    box-shadow: inset ${focusRing};
    outline: none;
  }
`;

export const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
  gap: ${space.sm};
`;

export const ItemTitle = styled.h2`
  display: flex;
  margin: ${space.sm} 0 0;
  align-items: center;
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.extraBold};
  gap: ${space.sm};
  line-height: ${lineHeight.heading};
`;

export const UnreadDot = styled.span`
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: ${color.primary};
`;

export const ItemBody = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const StatePanel = styled.div<{ $compact?: boolean }>`
  display: flex;
  min-height: ${({ $compact }) => ($compact ? 'auto' : '280px')};
  padding: ${({ $compact }) => ($compact ? space.md : space.xxl)};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: ${space.sm};
  text-align: center;
`;

export const StateTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
`;

export const EmptyDescription = styled.p`
  max-width: 430px;
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const LoadMoreButton = styled.button`
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: ${radius.pill};
  margin-top: ${space.sm};
  background: ${color.primary};
  color: #ffffff;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const ActionError = styled.p`
  margin: 0 0 ${space.sm};
  color: #b72e3f;
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;
