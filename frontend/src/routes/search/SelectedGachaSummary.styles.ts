import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const shimmer = keyframes`
  to {
    background-position-x: -220%;
  }
`;

export const Summary = styled.section`
  display: flex;
  min-height: 102px;
  padding: 18px 20px;
  align-items: center;
  gap: 16px;
  border: 1px solid rgb(217 59 84 / 20%);
  border-radius: 18px;
  background: var(--color-primary-soft, #fbf0f2);
  color: var(--color-text, #242122);

  @media (max-width: 767px) {
    min-height: 72px;
    padding: 9px 12px;
    gap: 10px;
    border-radius: 14px;
    box-shadow: 0 8px 24px rgb(36 33 34 / 14%);
  }
`;

export const ThumbnailFrame = styled.div`
  position: relative;
  overflow: hidden;
  width: 68px;
  height: 68px;
  flex: 0 0 auto;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 14px;
  background: var(--color-primary-soft, #fbf0f2);

  @media (max-width: 767px) {
    width: 52px;
    height: 52px;
    border-radius: 11px;
  }
`;

export const ThumbnailFallback = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-primary, #d93b54);
  font-size: 26px;
  font-weight: 800;
  opacity: 0.45;
`;

export const Thumbnail = styled.img`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Information = styled.div`
  min-width: 0;
`;

export const Eyebrow = styled.p`
  margin: 0 0 5px;
  color: var(--color-primary, #d93b54);
  font-size: 13px;
  font-weight: 750;
  line-height: 1.4;

  @media (max-width: 767px) {
    margin-bottom: 2px;
    font-size: 11px;
  }
`;

export const ProductName = styled.h2`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 750;
  line-height: 1.4;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: 767px) {
    font-size: 15px;
    -webkit-line-clamp: 1;
  }
`;

export const CategoryText = styled.p`
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--color-text-muted, #777173);
  font-size: 13px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 767px) {
    margin-top: 2px;
    font-size: 11px;
  }
`;

export const StateMessage = styled.div`
  display: grid;
  width: 100%;
  min-height: 64px;
  place-items: center;
  color: var(--color-text-muted, #777173);
  font-size: 14px;
  text-align: center;
`;

export const LoadingThumbnail = styled.div`
  width: 68px;
  height: 68px;
  flex: 0 0 auto;
  border-radius: 14px;
  background: linear-gradient(100deg, #eeeae8 20%, #f8f6f5 38%, #eeeae8 56%);
  background-size: 220% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (max-width: 767px) {
    width: 52px;
    height: 52px;
    border-radius: 11px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const LoadingText = styled.div`
  width: min(320px, 60vw);
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(100deg, #eeeae8 20%, #f8f6f5 38%, #eeeae8 56%);
  background-size: 220% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (max-width: 767px) {
    width: min(240px, 58vw);
    height: 34px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
