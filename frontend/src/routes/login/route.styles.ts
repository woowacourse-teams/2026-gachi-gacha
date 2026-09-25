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
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 50% 18%, rgb(217 59 84 / 9%), transparent 34%),
    ${color.surface};
  grid-template-rows: auto 1fr;
`;

export const Header = styled.header`
  padding: ${space.lg} clamp(${space.md}, 4vw, ${space.xxl});
  border-bottom: 1px solid ${color.border};
  background: rgb(255 255 255 / 92%);
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
  object-fit: contain;
`;

export const Main = styled.main`
  display: grid;
  padding: clamp(${space.xxl}, 8vh, 88px) ${space.md};
  place-items: start center;
`;

export const Card = styled.section`
  width: min(100%, 440px);
  padding: clamp(${space.xxl}, 6vw, ${space.huge});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
  text-align: center;
`;

export const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: ${lineHeight.heading};
`;

export const Description = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const ProviderList = styled.div`
  display: grid;
  margin-top: ${space.xxl};
  justify-items: center;
  gap: ${space.sm};
`;

export const ProviderLink = styled.a`
  display: flex;
  width: 232px;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: ${radius.control};
  transition:
    opacity 160ms ease,
    transform 160ms ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ProviderImage = styled.img`
  display: block;
  max-width: 224px;
  height: auto;
`;

export const ErrorMessage = styled.p`
  padding: ${space.sm} ${space.md};
  border-radius: ${radius.control};
  margin: ${space.lg} 0 0;
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

export const RetryButton = styled.button`
  padding: 0;
  border: 0;
  margin-top: ${space.sm};
  background: transparent;
  color: ${color.primary};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
  text-decoration: underline;
  text-underline-offset: 3px;
`;

export const PrivacyNote = styled.p`
  margin: ${space.xl} 0 0;
  color: ${color.textSubtle};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.relaxed};
`;

export const BackLink = styled.a`
  display: inline-flex;
  margin-top: ${space.xl};
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.medium};
  text-decoration: none;

  &:hover {
    color: ${color.text};
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;
