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
`;

export const FactCard = styled.li`
  display: flex;
  min-width: 0;
  min-height: 124px;
  padding: ${space.lg};
  justify-content: space-between;
  flex-direction: column;
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};

  @media (max-width: ${breakpoint.compact}) {
    min-height: 108px;
    padding: ${space.md};
  }
`;

export const FactIcon = styled.span`
  display: block;
  width: 26px;
  height: 26px;
  color: ${color.text};

  svg {
    display: block;
    width: 100%;
    height: 100%;
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
