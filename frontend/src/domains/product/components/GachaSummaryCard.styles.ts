import styled from '@emotion/styled';

import {
  breakpoint,
  color,
  fontSize,
  fontWeight,
  lineHeight,
  motion,
  radius,
  space,
} from '@/shared/styles/tokens';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';

export const Card = styled.div`
  min-width: 0;
`;

export const GachaImageFrame = styled.div`
  position: relative;
  overflow: hidden;
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  aspect-ratio: 4 / 3;
  background: ${color.primarySoft};
  transition:
    transform ${motion.fast} ease,
    border-color ${motion.fast} ease,
    box-shadow ${motion.fast} ease;
`;

export const GachaImageFallback = styled.span`
  position: absolute;
  display: grid;
  inset: 0;
  place-items: center;

  img {
    width: 24%;
  }
`;

export const GachaImage = styled(ImageWithFallback)`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const GachaName = styled.strong`
  display: -webkit-box;
  height: 44px;
  margin-top: ${space.sm};
  overflow: hidden;
  color: ${color.text};
  font-size: ${fontSize.body};
  font-weight: ${fontWeight.bold};
  line-height: 1.45;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: ${breakpoint.mobile}) {
    display: block;
    height: 20px;
    margin-top: ${space.xs};
    overflow: hidden;
    font-size: ${fontSize.label};
    line-height: ${lineHeight.body};
    text-overflow: ellipsis;
    white-space: nowrap;
    -webkit-line-clamp: unset;
  }
`;

export const CategoryText = styled.span`
  display: block;
  margin-top: ${space.xxs};
  overflow: hidden;
  color: ${color.textMuted};
  font-size: ${fontSize.caption};
  line-height: ${lineHeight.body};
  text-overflow: ellipsis;
  white-space: nowrap;
`;
