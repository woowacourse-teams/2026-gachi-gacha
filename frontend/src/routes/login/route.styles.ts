import { css } from '@emotion/react';
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
  gap: ${space.xs};
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
  width: min(100%, 375px);
  margin-top: clamp(${space.xxl}, 6vh, ${space.huge});
  gap: ${space.sm};
`;

const providerButtonLayout = css`
  display: flex;
  width: 100%;
  min-width: 140px;
  min-height: 30px;
  aspect-ratio: 375 / 44;
  padding: 0 ${space.xl};
  align-items: center;
  justify-content: center;
  gap: ${space.xs};
  border: 0;
  border-radius: ${radius.card};
  font-size: 19px;
  font-weight: ${fontWeight.medium};
  line-height: 1;
  text-decoration: none;
`;

export const AppleProviderLink = styled.a`
  ${providerButtonLayout};
  background: #000000;
  color: #ffffff;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
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

export const AppleProviderLogo = styled.img`
  display: block;
  width: auto;
  height: 100%;
  flex: 0 0 auto;
`;

export const ProviderLink = styled.a<{ $provider: 'kakao' | 'naver' }>`
  ${providerButtonLayout};
  background: ${({ $provider }) =>
    $provider === 'kakao' ? '#fee500' : '#03a94d'};
  color: ${({ $provider }) => ($provider === 'kakao' ? '#191919' : '#ffffff')};
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
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
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;

  img {
    display: block;
    width: 44px;
    height: 44px;
    object-fit: contain;
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
