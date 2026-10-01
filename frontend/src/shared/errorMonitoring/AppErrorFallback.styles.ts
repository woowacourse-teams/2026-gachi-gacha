import styled from '@emotion/styled';

import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
} from '@/shared/styles/tokens';

export const ErrorScreen = styled.main`
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  padding: ${space.xl};
  background: ${color.surface};
  place-items: center;
`;

export const ErrorCard = styled.section`
  width: min(100%, 480px);
  padding: clamp(${space.xl}, 6vw, ${space.xxxl});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surface};
  text-align: center;
`;

export const ErrorTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  line-height: ${lineHeight.heading};
`;

export const ErrorDescription = styled.p`
  margin: ${space.md} 0 ${space.xl};
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;

export const ReloadButton = styled.button`
  min-height: 48px;
  padding: ${space.sm} ${space.xl};
  border: 0;
  border-radius: ${radius.control};
  background: ${color.primary};
  color: ${color.surface};
  cursor: pointer;
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};

  &:hover {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    outline: 3px solid color-mix(in srgb, ${color.primary} 28%, transparent);
    outline-offset: 3px;
  }
`;
