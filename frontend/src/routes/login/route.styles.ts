import { css } from '@emotion/react';
import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontWeight,
  letterSpacing,
  lineHeight,
  radius,
  space,
} from '@/shared/styles/tokens';

const mobile = `@media (max-width: ${breakpoint.mobile})`;

export const Page = styled.div`
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  padding: ${space.xxxl} ${space.md};
  align-items: center;
  justify-content: center;
  background: #f7f5f3;
  box-sizing: border-box;

  ${mobile} {
    padding: env(safe-area-inset-top) 0 0;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    background: ${color.surface};
  }
`;

export const TopBar = styled.div`
  display: none;

  ${mobile} {
    display: flex;
    height: 48px;
    padding: 0 14px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
  }
`;

export const CloseLink = styled.a`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: ${radius.circle};
  color: ${color.text};

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

export const Main = styled.main`
  display: flex;
  width: min(100%, 520px);
  justify-content: center;

  ${mobile} {
    width: 100%;
    flex: 1;
  }
`;

export const Card = styled.section`
  display: flex;
  width: 100%;
  padding: 56px ${space.xxxl} ${space.huge};
  flex-direction: column;
  align-items: center;
  gap: 36px;
  border: 1px solid ${color.border};
  border-radius: ${radius.sheet};
  background: ${color.surface};
  box-sizing: border-box;
  text-align: center;

  @media (max-width: 560px) {
    padding: ${space.huge} ${space.xl} ${space.xxxl};
  }

  ${mobile} {
    padding: 0 ${space.xl} calc(28px + env(safe-area-inset-bottom));
    gap: ${space.xl};
    border: 0;
    border-radius: 0;
  }
`;

export const VisuallyHiddenTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const Message = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 36px;

  ${mobile} {
    flex: 1;
    justify-content: center;
    gap: 44px;
  }
`;

export const Brand = styled.a`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: ${color.primary};
  font-size: 38px;
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.heading};
  line-height: 1;
  text-decoration: none;

  &:focus-visible {
    border-radius: ${radius.small};
    box-shadow: ${focusRing};
    outline: none;
  }

  ${mobile} {
    font-size: 34px;
  }
`;

export const BrandLogo = styled.img`
  width: auto;
  height: 52px;
  object-fit: contain;

  ${mobile} {
    height: 46px;
  }
`;

export const BrandName = styled.span``;

export const FlowNotice = styled.p`
  margin: -${space.md} 0 0;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: ${lineHeight.body};
`;

export const ProviderList = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 28px;
`;

const providerLinkLayout = css`
  display: flex;
  min-width: 64px;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-radius: ${radius.control};
  color: ${color.text};
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none;
  transition: transform 160ms ease;

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

export const ProviderLink = styled.a`
  ${providerLinkLayout};
`;

export const AppleProviderLink = styled.a`
  ${providerLinkLayout};
`;

export const ProviderIcon = styled.span`
  display: grid;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  place-items: center;

  img {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: contain;
  }
`;

export const AppleProviderIcon = styled(ProviderIcon)`
  overflow: hidden;
  border-radius: 50%;
  background: #000000;

  > img {
    width: auto;
    height: 100%;
  }
`;

export const AppleProviderLogo = styled.img`
  display: block;
  width: auto;
  height: 100%;
`;

export const ProviderLabel = styled.span`
  white-space: nowrap;
`;

export const ErrorMessage = styled.p`
  margin: 0;
  padding: ${space.sm} ${space.md};
  border-radius: ${radius.control};
  background: ${color.primarySoft};
  color: ${color.primary};
  font-size: 14px;
  line-height: ${lineHeight.body};
`;

export const RetryButton = styled.button`
  margin-top: ${space.xs};
  padding: 0;
  border: 0;
  background: transparent;
  color: ${color.primary};
  font-size: 14px;
  font-weight: ${fontWeight.bold};
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`;

export const PrivacyNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: 13px;
  line-height: ${lineHeight.relaxed};
  word-break: keep-all;

  ${mobile} {
    font-size: 12px;
  }
`;

export const PrivacyLink = styled.a`
  color: ${color.text};
  font-weight: ${fontWeight.bold};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    border-radius: 3px;
    box-shadow: ${focusRing};
    outline: none;
  }
`;
