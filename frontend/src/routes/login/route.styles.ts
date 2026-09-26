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
    radial-gradient(circle at 50% 42%, rgb(217 59 84 / 10%), transparent 38%),
    ${color.surface};
`;

export const Brand = styled.a`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  gap: ${space.sm};
  color: ${color.primary};
  font-size: clamp(20px, 3vw, 24px);
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
  height: clamp(32px, 5vw, 40px);
  object-fit: contain;
`;

export const BrandName = styled.span``;

export const Main = styled.main`
  width: min(100%, 540px);
`;

export const Card = styled.section`
  display: flex;
  width: 100%;
  padding: clamp(${space.xxl}, 6vw, 56px);
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  align-items: center;
  background: ${color.surface};
  box-shadow: ${shadow.card};
  flex-direction: column;
  text-align: center;

  @media (max-width: 520px) {
    padding: ${space.xxl} ${space.lg};
    border-radius: ${radius.card};
  }
`;

export const Title = styled.h1`
  margin: clamp(${space.xxl}, 6vh, ${space.huge}) 0 0;
  color: ${color.text};
  font-size: clamp(26px, 5vw, 36px);
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: 1.35;
`;

export const Accent = styled.span`
  color: ${color.primary};
`;

export const ProviderList = styled.div`
  display: grid;
  width: 100%;
  margin-top: clamp(${space.xxl}, 6vh, ${space.huge});
  gap: ${space.sm};
`;

export const ProviderLink = styled.a<{ $provider: 'kakao' | 'naver' }>`
  display: flex;
  width: 100%;
  height: 56px;
  padding: 0 ${space.xl};
  align-items: center;
  justify-content: center;
  gap: ${space.sm};
  border: 1px solid
    ${({ $provider }) => ($provider === 'kakao' ? '#dbc600' : '#009f49')};
  border-radius: ${radius.card};
  background: ${({ $provider }) =>
    $provider === 'kakao' ? '#f1da19' : '#08b957'};
  color: ${({ $provider }) => ($provider === 'kakao' ? '#191919' : '#ffffff')};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};
  text-decoration: none;
  transition:
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: ${({ $provider }) =>
      $provider === 'kakao' ? '#e6cf08' : '#00a94e'};
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

export const ProviderIcon = styled.span`
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  font-size: 21px;
  font-weight: 900;
  line-height: 1;
  place-items: center;

  svg {
    display: block;
    width: 24px;
    height: 24px;
  }
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
  margin: ${space.lg} 0 0;
  color: ${color.textSubtle};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.relaxed};
`;

export const PrivacyLink = styled.a`
  color: ${color.textMuted};
  font-weight: ${fontWeight.bold};
  text-decoration: underline;
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
