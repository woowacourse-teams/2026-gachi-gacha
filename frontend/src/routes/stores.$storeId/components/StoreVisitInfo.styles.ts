import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radius,
  space,
} from '@/shared/styles/tokens';

export const Section = styled.section`
  padding-top: ${space.xxl};
  margin-top: ${space.xxxl};
  border-top: 1px solid ${color.border};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
  letter-spacing: ${letterSpacing.heading};
`;

export const InfoList = styled.ul`
  display: grid;
  padding: 0;
  margin: ${space.lg} 0 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space.md} ${space.xl};
  list-style: none;

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const InfoItem = styled.li`
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: ${space.sm};
`;

export const InfoIcon = styled.span`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: ${radius.control};
  background: ${color.surfaceMuted};
  color: ${color.text};
  place-items: center;

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const InfoContent = styled.div`
  min-width: 0;
`;

export const InfoLabel = styled.span`
  display: block;
  color: ${color.textSubtle};
  font-size: ${fontSize.label};
  font-weight: ${fontWeight.medium};
  line-height: ${lineHeight.body};
`;

export const InfoValue = styled.span`
  display: block;
  margin-top: ${space.xxs};
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.medium};
  line-height: ${lineHeight.relaxed};
  overflow-wrap: anywhere;
  white-space: pre-line;
`;

export const InfoLink = styled.a`
  border-radius: ${radius.small};
  color: inherit;
  text-decoration: underline;
  text-decoration-color: ${color.border};
  text-underline-offset: 3px;

  &:hover {
    color: ${color.primary};
    text-decoration-color: currentColor;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;
