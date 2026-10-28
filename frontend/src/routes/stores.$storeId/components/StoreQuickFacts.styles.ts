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
  margin-top: ${space.xxl};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
  letter-spacing: ${letterSpacing.heading};
`;

export const FactList = styled.ul`
  display: grid;
  padding: 0;
  margin: ${space.md} 0 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.sm};
  list-style: none;

  @media (max-width: ${breakpoint.tablet}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${breakpoint.compact}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const FactCard = styled.li`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: ${space.sm};
`;

export const FactIcon = styled.span`
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

export const FactText = styled.span`
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.body};
  overflow-wrap: anywhere;
  word-break: keep-all;
`;
