import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  focusRing,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  motion,
  radius,
  space,
} from '@/shared/styles/tokens';

const breathe = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.75; }
`;

export const Section = styled.section`
  padding-top: ${space.xxl};
  margin-top: ${space.xxxl};
  border-top: 1px solid ${color.border};
`;

export const CatalogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space.md};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${fontSize.sectionTitle};
  font-weight: ${fontWeight.bold};
  line-height: ${lineHeight.heading};
  letter-spacing: ${letterSpacing.heading};
`;

export const ResultCount = styled.span`
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};
`;

export const GachaList = styled.ul`
  display: grid;
  padding: 0;
  margin: ${space.lg} 0 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.lg};
  list-style: none;

  @media (max-width: ${breakpoint.tablet}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: ${breakpoint.compact}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space.sm};
  }
`;

export const GachaItem = styled.li`
  min-width: 0;
`;

export const LoadingGrid = styled.div`
  display: grid;
  margin-top: ${space.lg};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${space.lg};

  @media (max-width: ${breakpoint.tablet}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: ${breakpoint.compact}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space.sm};
  }
`;

export const LoadingCard = styled.div`
  display: grid;
  border: 1px solid ${color.borderSubtle};
  border-radius: ${radius.card};
  aspect-ratio: 4 / 3;
  background: ${color.surfaceMuted};
  place-items: center;

  img {
    width: 22%;
    animation: ${breathe} ${motion.loading} ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      opacity: 0.6;
      animation: none;
    }
  }
`;

export const EmptyState = styled.div`
  display: flex;
  min-height: 160px;
  padding: ${space.xl};
  margin-top: ${space.lg};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: ${radius.card};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${fontSize.body};
  line-height: ${lineHeight.relaxed};
  text-align: center;
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: ${color.primary};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

export const LoadMoreArea = styled.div`
  display: flex;
  min-height: 72px;
  padding-top: ${space.lg};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: ${space.sm};
`;

export const StatusText = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.bodySmall};
  line-height: ${lineHeight.body};
`;

export const RetryButton = styled.button`
  min-height: 42px;
  padding: 0 ${space.lg};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  cursor: pointer;
  font-size: ${fontSize.bodySmall};
  font-weight: ${fontWeight.bold};

  &:hover {
    border-color: ${color.primary};
    color: ${color.primary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;
