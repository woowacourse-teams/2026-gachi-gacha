import styled from '@emotion/styled';

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
  width: min(100% - 40px, 1180px);
  padding: clamp(${space.xxl}, 5vw, 64px) 0 80px;
  margin: 0 auto;

  @media (max-width: 520px) {
    width: min(100% - 24px, 1180px);
    padding-top: ${space.xl};
  }
`;

export const PageHeader = styled.header``;

export const Heading = styled.h1`
  margin: 0;
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: ${lineHeight.heading};
`;

export const Subheading = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.body};
`;

export const Dashboard = styled.div`
  display: grid;
  margin-top: ${space.xxl};
  align-items: start;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: ${space.xl};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  position: sticky;
  top: 104px;

  @media (max-width: 900px) {
    position: static;
  }
`;

export const ProfileCard = styled.section`
  padding: ${space.xl};
  border: 1px solid #f3cbd2;
  border-radius: ${radius.dialog};
  background: ${color.primarySoft};
`;

export const ProfileIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: ${space.md};
`;

export const ProfileImage = styled.img`
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  border-radius: ${radius.circle};
  background: ${color.surface};
  object-fit: cover;
`;

export const ProfileFallback = styled.div`
  display: grid;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  border-radius: ${radius.circle};
  background: ${color.primary};
  color: #ffffff;
  font-size: ${fontSize.detailTitle};
  font-weight: ${fontWeight.extraBold};
  place-items: center;
`;

export const MemberName = styled.h2`
  overflow: hidden;
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  line-height: ${lineHeight.heading};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MemberDescription = styled.p`
  margin: ${space.xxs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

export const ProfileDetails = styled.div`
  display: grid;
  padding-top: ${space.md};
  border-top: 1px solid rgb(217 59 84 / 16%);
  margin-top: ${space.lg};
  gap: ${space.xs};
`;

export const ProfileDetail = styled.a`
  display: grid;
  min-height: 56px;
  padding: ${space.sm};
  align-items: center;
  border-radius: ${radius.control};
  color: ${color.text};
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: ${space.sm};
  text-decoration: none;

  &:hover {
    background: rgb(255 255 255 / 70%);
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const ProfileDetailIcon = styled.span`
  display: grid;
  color: ${color.primary};
  place-items: center;
`;

export const ProfileDetailCopy = styled.span`
  min-width: 0;
`;

export const ProfileDetailLabel = styled.strong`
  display: block;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const ProfileDetailValue = styled.span`
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Content = styled.div`
  display: grid;
  min-width: 0;
  gap: ${space.lg};
`;

export const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.sm};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 390px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.article`
  min-height: 132px;
  padding: ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};
`;

export const SummaryTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space.sm};
`;

export const SummaryLabel = styled.h2`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const SummaryIcon = styled.span`
  display: grid;
  color: ${color.primary};
  place-items: center;
`;

export const SummaryValue = styled.strong`
  display: block;
  margin-top: ${space.md};
  font-size: 28px;
  font-weight: ${fontWeight.extraBold};
  line-height: 1;
`;

export const SummaryDescription = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};
`;

export const Card = styled.section`
  padding: ${space.xl};
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};

  @media (max-width: 520px) {
    padding: ${space.lg};
    border-radius: ${radius.card};
  }
`;

export const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space.md};
`;

export const CardTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.heading};
  line-height: ${lineHeight.heading};
`;

export const CardLink = styled.a`
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    border-radius: ${radius.small};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const TradeList = styled.div`
  display: grid;
  margin-top: ${space.md};
  gap: ${space.xs};
`;

export const TradeItem = styled.article`
  display: grid;
  min-width: 0;
  padding: ${space.sm};
  align-items: center;
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  grid-template-columns: 68px minmax(0, 1fr) auto;
  gap: ${space.md};

  @media (max-width: 520px) {
    grid-template-columns: 56px minmax(0, 1fr);
  }
`;

export const TradeThumbnail = styled.img`
  width: 68px;
  height: 68px;
  border-radius: ${radius.control};
  background: ${color.primarySoft};
  object-fit: cover;

  @media (max-width: 520px) {
    width: 56px;
    height: 56px;
  }
`;

export const TradeCopy = styled.div`
  min-width: 0;
`;

export const TradeTitle = styled.h3`
  overflow: hidden;
  margin: 0;
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TradeMeta = styled.p`
  overflow: hidden;
  margin: ${space.xxs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StatusBadge = styled.span`
  padding: 7px 10px;
  border-radius: ${radius.pill};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
  white-space: nowrap;

  @media (max-width: 520px) {
    width: fit-content;
    margin-top: ${space.xs};
    grid-column: 2;
  }
`;

export const StatePanel = styled.div`
  display: grid;
  min-height: 148px;
  padding: ${space.xl};
  margin-top: ${space.md};
  align-content: center;
  justify-items: center;
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  text-align: center;
`;

export const StateTitle = styled.strong`
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
`;

export const StateDescription = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const RetryButton = styled.button`
  min-height: 40px;
  padding: 0 ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  margin-top: ${space.md};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};

  &:hover {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const InterestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space.lg};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const InterestBody = styled.div`
  display: grid;
  min-height: 168px;
  margin-top: ${space.md};
  align-content: center;
  justify-items: center;
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  text-align: center;
`;

export const EmptyIcon = styled.span`
  display: grid;
  width: 48px;
  height: 48px;
  border-radius: ${radius.circle};
  background: ${color.primarySoft};
  color: ${color.primary};
  place-items: center;
`;

export const PreparationBadge = styled.span`
  padding: 5px 9px;
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

export const AccountMenu = styled.div`
  display: grid;
  margin-top: ${space.md};
  gap: ${space.xs};
`;

const accountMenuItemStyles = `
  display: grid;
  width: 100%;
  min-height: 60px;
  padding: 0 14px;
  align-items: center;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text, #242122);
  cursor: pointer;
  font: inherit;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  text-align: left;
  text-decoration: none;

  &:hover {
    background: var(--color-surface-muted, #faf9f8);
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const AccountMenuLink = styled.a`
  ${accountMenuItemStyles}
`;

export const AccountMenuButton = styled.button`
  ${accountMenuItemStyles}
`;

export const AccountMenuIcon = styled.span`
  display: grid;
  color: ${color.primary};
  place-items: center;
`;

export const AccountMenuCopy = styled.span`
  min-width: 0;
`;

export const AccountMenuLabel = styled.strong`
  display: block;
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
`;

export const AccountMenuDescription = styled.span`
  display: block;
  margin-top: 2px;
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};
`;

export const LogoutMenuButton = styled(AccountMenuButton)`
  color: ${color.primary};
`;
