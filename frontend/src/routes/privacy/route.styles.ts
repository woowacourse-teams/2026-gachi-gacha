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
  background: ${color.surfaceMuted};
  color: ${color.text};
`;

export const Header = styled.header`
  position: sticky;
  z-index: 1;
  top: 0;
  border-bottom: 1px solid ${color.border};
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(12px);
`;

export const HeaderContent = styled.div`
  display: flex;
  width: min(100% - 32px, 960px);
  min-height: 68px;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: ${space.md};
`;

export const Brand = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${space.sm};
  color: ${color.primary};
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.heading};
  text-decoration: none;

  &:focus-visible {
    border-radius: ${radius.small};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const BrandLogo = styled.img`
  width: auto;
  height: 30px;
`;

export const SearchLink = styled.a`
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-decoration: none;

  &:hover {
    color: ${color.primary};
  }

  &:focus-visible {
    border-radius: ${radius.small};
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const Main = styled.main`
  width: min(100% - 32px, 960px);
  padding: clamp(${space.xxl}, 6vw, 64px) 0 80px;
  margin: 0 auto;
`;

export const Document = styled.article`
  padding: clamp(${space.xl}, 6vw, 64px);
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
`;

export const Title = styled.h1`
  margin: 0;
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: ${lineHeight.heading};
`;

export const Introduction = styled.p`
  margin: ${space.md} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const EffectiveDate = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textSubtle};
  font-size: ${fontSize.bodySmall};
`;

export const DraftNotice = styled.aside`
  padding: ${space.md};
  border-radius: ${radius.control};
  margin-top: ${space.xl};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  line-height: ${lineHeight.relaxed};
`;

export const Section = styled.section`
  padding-top: ${space.xxl};
  border-top: 1px solid ${color.borderSubtle};
  margin-top: ${space.xxl};

  p {
    margin: ${space.sm} 0 0;
    color: ${color.textMuted};
    font-size: ${fontSize.body};
    line-height: ${lineHeight.relaxed};
  }

  ul,
  ol {
    padding-left: ${space.xl};
    margin: ${space.sm} 0 0;
    color: ${color.textMuted};
    font-size: ${fontSize.body};
    line-height: ${lineHeight.relaxed};
  }
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.heading};
  line-height: ${lineHeight.heading};
`;

export const SubsectionTitle = styled.h3`
  margin: ${space.lg} 0 0;
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};
`;

export const TableScroll = styled.div`
  margin-top: ${space.md};
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};

  th,
  td {
    padding: ${space.sm} ${space.md};
    border: 1px solid ${color.border};
    text-align: left;
    vertical-align: top;
  }

  th {
    background: ${color.surfaceMuted};
    font-weight: ${fontWeight.bold};
    white-space: nowrap;
  }

  td {
    color: ${color.textMuted};
  }
`;

export const ExternalLink = styled.a`
  color: ${color.primary};
  font-weight: ${fontWeight.bold};
  text-underline-offset: 3px;

  &:focus-visible {
    border-radius: 3px;
    box-shadow: ${focusRing};
    outline: none;
  }
`;
