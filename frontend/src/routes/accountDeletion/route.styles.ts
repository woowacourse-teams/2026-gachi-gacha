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
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(${space.lg}, 5vh, ${space.huge}) ${space.md};
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 34%, rgb(217 59 84 / 10%), transparent 36%),
    ${color.surfaceMuted};
  color: ${color.text};
`;

export const Main = styled.main`
  width: min(100%, 620px);
`;

export const Card = styled.section`
  padding: clamp(${space.xl}, 6vw, ${space.huge});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};

  @media (max-width: 520px) {
    padding: ${space.xl} ${space.lg};
    border-radius: ${radius.card};
  }
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
  height: 34px;
  object-fit: contain;
`;

export const Eyebrow = styled.p`
  margin: ${space.xxl} 0 0;
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const Title = styled.h1`
  margin: ${space.xs} 0 0;
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: ${lineHeight.heading};
`;

export const Description = styled.p`
  margin: ${space.md} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const Information = styled.div`
  padding: ${space.lg};
  border-radius: ${radius.control};
  margin-top: ${space.xl};
  background: ${color.surfaceMuted};
`;

export const InformationTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};
`;

export const InformationList = styled.ul`
  padding-left: ${space.lg};
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const AccountSummary = styled.p`
  padding: ${space.sm} ${space.md};
  border: 1px solid ${color.border};
  border-radius: ${radius.control};
  margin: ${space.xl} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};

  strong {
    color: ${color.text};
  }
`;

export const ErrorMessage = styled.p`
  padding: ${space.sm} ${space.md};
  border-radius: ${radius.control};
  margin: ${space.xl} 0 0;
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const Actions = styled.div`
  display: flex;
  margin-top: ${space.xl};
  align-items: center;
  justify-content: flex-end;
  gap: ${space.sm};

  @media (max-width: 520px) {
    align-items: stretch;
    flex-direction: column-reverse;
  }
`;

const actionStyles = `
  display: inline-flex;
  min-height: 48px;
  padding: 0 20px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const SecondaryLink = styled.a`
  ${actionStyles}
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
`;

export const PrimaryLink = styled.a`
  ${actionStyles}
  border: 1px solid ${color.primary};
  background: ${color.primary};
  color: #ffffff;

  &:hover {
    background: ${color.primaryHover};
  }
`;

export const DangerButton = styled.button`
  ${actionStyles}
  border: 1px solid ${color.primary};
  background: ${color.primary};
  color: #ffffff;
  box-shadow: 0 8px 18px rgb(217 59 84 / 18%);

  &:hover {
    background: ${color.primaryHover};
  }
`;

export const TextButton = styled.button`
  padding: 0;
  border: 0;
  margin-top: ${space.sm};
  background: transparent;
  color: ${color.primary};
  cursor: pointer;
  font: inherit;
  font-weight: ${fontWeight.bold};
  text-decoration: underline;
  text-underline-offset: 3px;
`;

export const FinePrint = styled.p`
  margin: ${space.lg} 0 0;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.relaxed};
`;

export const InlineLink = styled.a`
  color: ${color.textMuted};
  font-weight: ${fontWeight.bold};
  text-underline-offset: 3px;

  &:hover {
    color: ${color.primary};
  }

  &:focus-visible {
    border-radius: 3px;
    box-shadow: ${focusRing};
    outline: none;
  }
`;
