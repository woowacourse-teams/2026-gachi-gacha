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
  width: min(100% - 40px, 880px);
  padding: ${space.xl} 0 96px;
  margin: 0 auto;

  @media (max-width: 520px) {
    width: min(100% - 24px, 880px);
  }
`;

export const BackLink = styled(Link)`
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

export const Hero = styled.header`
  padding: clamp(${space.xl}, 6vw, 56px);
  border: 1px solid #f1c7ce;
  border-radius: ${radius.dialog};
  margin: ${space.lg} 0 ${space.xxl};
  background:
    radial-gradient(circle at 88% 20%, rgb(200 73 89 / 16%), transparent 30%),
    linear-gradient(135deg, #fff5f7 0%, #fffaf3 100%);
  box-shadow: ${shadow.card};
`;

export const Eyebrow = styled.span`
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const Title = styled.h1`
  margin: ${space.sm} 0 ${space.sm};
  font-size: clamp(34px, 6vw, 52px);
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: 1.14;
`;

export const Intro = styled.p`
  max-width: 680px;
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const ReleaseList = styled.div`
  display: grid;
  gap: ${space.lg};
`;

export const ReleaseCard = styled.article`
  padding: clamp(${space.lg}, 5vw, ${space.xxl});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
`;

export const ReleaseHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space.md};

  @media (max-width: 520px) {
    flex-direction: column;
  }
`;

export const ReleaseMeta = styled.div`
  display: flex;
  align-items: center;
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  gap: ${space.xs};
`;

export const Version = styled.strong`
  color: ${color.primary};
  font-size: ${fontSize.body};
`;

export const LatestBadge = styled.span`
  padding: 5px 9px;
  border-radius: ${radius.pill};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

export const ReleaseTitle = styled.h2`
  margin: ${space.sm} 0 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  line-height: ${lineHeight.heading};
`;

export const ReleaseSummary = styled.p`
  margin: ${space.md} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const HighlightList = styled.ul`
  display: grid;
  padding-left: 22px;
  margin: ${space.md} 0 0;
  color: ${color.text};
  font-size: ${fontSize.bodySmall};
  gap: ${space.xs};
  line-height: ${lineHeight.relaxed};

  li::marker {
    color: ${color.primary};
  }
`;

export const ReleaseSourceLink = styled.a`
  display: inline-flex;
  margin-top: ${space.lg};
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-underline-offset: 3px;

  &:focus-visible {
    border-radius: ${radius.small};
    box-shadow: ${focusRing};
    outline: none;
  }
`;
