import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
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

export const PriceList = styled.dl`
  padding: 0;
  margin: ${space.md} 0 0;
`;

export const PriceRow = styled.div`
  display: flex;
  min-height: 56px;
  padding: ${space.md} 0;
  align-items: center;
  justify-content: space-between;
  gap: ${space.lg};
  border-bottom: 1px solid ${color.borderSubtle};

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: ${breakpoint.compact}) {
    min-height: 52px;
    padding: ${space.sm} 0;
  }
`;

export const PriceLabel = styled.dt`
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.medium};
  line-height: ${lineHeight.body};
`;

export const PriceValue = styled.dd`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
  text-align: right;
  white-space: nowrap;
`;
