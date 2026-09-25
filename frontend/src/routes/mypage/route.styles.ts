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
  width: min(100% - 32px, 920px);
  margin: 0 auto;
  padding: clamp(${space.xxl}, 7vw, 72px) 0;
`;

export const Heading = styled.h1`
  margin: 0;
  font-size: ${fontSize.pageTitle};
  font-weight: ${fontWeight.extraBold};
  letter-spacing: ${letterSpacing.title};
  line-height: ${lineHeight.heading};
`;

export const AccountCard = styled.section`
  display: grid;
  padding: clamp(${space.xl}, 5vw, ${space.huge});
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  margin-top: ${space.xl};
  align-items: center;
  background: ${color.surface};
  box-shadow: ${shadow.card};
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: ${space.lg};

  @media (max-width: 560px) {
    justify-items: center;
    text-align: center;
    grid-template-columns: 1fr;
  }
`;

export const ProfileImage = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${color.primarySoft};
  object-fit: cover;
`;

export const ProfileFallback = styled.div`
  display: grid;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${color.primary};
  color: #ffffff;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.extraBold};
  place-items: center;
`;

export const MemberName = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
`;

export const MemberLocation = styled.p`
  margin: ${space.xs} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.body};
`;

export const LogoutButton = styled.button`
  min-height: 44px;
  padding: 0 ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textMuted};
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

export const PreparationCard = styled.section`
  padding: ${space.xl};
  border-radius: ${radius.card};
  margin-top: ${space.lg};
  background: ${color.surfaceMuted};
`;

export const PreparationTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.bold};
`;

export const PreparationDescription = styled.p`
  margin: ${space.sm} 0 0;
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
`;
