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

export const Page = styled.main`
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  padding: ${space.xl};
  background: ${color.surfaceMuted};
  place-items: center;
`;

export const Card = styled.section`
  display: grid;
  width: min(100%, 440px);
  padding: clamp(${space.xxl}, 6vw, ${space.huge});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  box-shadow: ${shadow.card};
  justify-items: center;
  text-align: center;
`;

export const Logo = styled.img`
  width: auto;
  height: 46px;
  object-fit: contain;
`;

export const Title = styled.h1`
  margin: ${space.xl} 0 0;
  font-size: ${fontSize.detailTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.heading};
  line-height: ${lineHeight.heading};
`;

export const Description = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const ActionLink = styled.a`
  display: inline-flex;
  min-height: 44px;
  padding: 0 ${space.xl};
  align-items: center;
  justify-content: center;
  border-radius: ${radius.pill};
  margin-top: ${space.xl};
  background: ${color.primary};
  color: #ffffff;
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
