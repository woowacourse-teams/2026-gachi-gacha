import styled from '@emotion/styled';

import {
  breakpoint,
  color,
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

export const AmenityList = styled.ul`
  display: grid;
  padding: 0;
  margin: ${space.lg} 0 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.md} ${space.xl};
  list-style: none;

  @media (max-width: ${breakpoint.tablet}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const AmenityItem = styled.li`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: ${space.sm};
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.medium};
  line-height: ${lineHeight.body};
  overflow-wrap: anywhere;
  word-break: keep-all;
`;

export const AmenityIcon = styled.span`
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
