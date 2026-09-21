import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const shimmer = keyframes`
  to {
    background-position-x: -220%;
  }
`;

export const Panel = styled.section`
  min-width: 0;
  color: var(--color-text, #242122);
`;

export const Header = styled.div`
  display: flex;
  padding: 18px 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-subtle, #f0eeec);
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.02em;
`;

export const Count = styled.span`
  color: var(--color-text-muted, #777173);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
`;

export const List = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const ListItem = styled.li`
  margin: 0;
`;

export const StateArea = styled.div`
  display: grid;
  min-height: 240px;
  padding: 32px 20px;
  place-items: center;
  color: var(--color-text-muted, #777173);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
`;

export const StateContent = styled.div`
  display: grid;
  justify-items: center;
  gap: 14px;
`;

export const StateMessage = styled.p`
  margin: 0;
`;

export const RetryButton = styled.button`
  min-height: 40px;
  padding: 0 18px;
  border: 1px solid var(--color-primary, #d93b54);
  border-radius: 999px;
  background: var(--color-surface, #ffffff);
  color: var(--color-primary, #d93b54);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-soft, #fbf0f2);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const LoadingList = styled.div`
  display: grid;
  padding: 20px 0;
  gap: 18px;
`;

export const LoadingCard = styled.div`
  height: 148px;
  border-radius: 16px;
  background: linear-gradient(100deg, #eeeae8 20%, #f8f6f5 38%, #eeeae8 56%);
  background-size: 220% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
