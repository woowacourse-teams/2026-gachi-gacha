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

export const FactList = styled.dl`
  display: grid;
  padding: 0;
  margin: ${space.md} 0 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.sm};

  @media (max-width: ${breakpoint.mobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space.xs};
  }
`;

export const FactCard = styled.div`
  min-width: 0;
  padding: ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};

  @media (max-width: ${breakpoint.compact}) {
    padding: ${space.md};
  }
`;

export const FactLabel = styled.dt`
  color: ${color.textMuted};
  font-size: ${fontSize.label};
  font-weight: ${fontWeight.medium};
  line-height: ${lineHeight.body};
`;

export const FactValue = styled.dd<{ $isPending: boolean }>`
  margin: ${space.xs} 0 0;
  color: ${({ $isPending }) => ($isPending ? color.textSubtle : color.text)};
  font-size: ${({ $isPending }) =>
    $isPending ? fontSize.bodySmall : fontSize.detailTitle};
  font-weight: ${({ $isPending }) =>
    $isPending ? fontWeight.regular : fontWeight.extraBold};
  line-height: ${lineHeight.heading};
  overflow-wrap: anywhere;
  word-break: keep-all;
`;
