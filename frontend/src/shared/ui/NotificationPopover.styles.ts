import styled from '@emotion/styled';
import { Link } from 'react-router';

export const Popover = styled.section`
  position: absolute;
  z-index: 60;
  top: calc(100% + 12px);
  right: 0;
  width: min(390px, calc(100vw - 24px));
  overflow: hidden;
  border: 1px solid var(--color-border, #e8e6e3);
  border-radius: 20px;
  background: var(--color-surface, #ffffff);
  box-shadow: 0 20px 52px rgb(35 31 32 / 18%);
  color: var(--color-text, #242122);

  &::before {
    position: absolute;
    top: -7px;
    right: 17px;
    width: 12px;
    height: 12px;
    transform: rotate(45deg);
    border-top: 1px solid var(--color-border, #e8e6e3);
    border-left: 1px solid var(--color-border, #e8e6e3);
    background: #ffffff;
    content: '';
  }

  @media (max-width: 520px) {
    right: -40px;
    border-radius: 18px;
  }
`;

export const Header = styled.header`
  display: flex;
  min-height: 62px;
  padding: 14px 16px 12px 20px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-subtle, #f0eeec);
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

export const CloseButton = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted, #696466);
  font-size: 23px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-soft, #fff1f3);
    color: var(--color-primary, #d93b54);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 1px;
  }
`;

export const List = styled.ul`
  max-height: min(430px, calc(100dvh - 190px));
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  list-style: none;
  overscroll-behavior: contain;

  & > li + li {
    border-top: 1px solid var(--color-border-subtle, #f0eeec);
  }
`;

export const ItemLink = styled(Link)`
  display: flex;
  padding: 14px 12px;
  align-items: flex-start;
  gap: 12px;
  border-radius: 13px;
  background: #ffffff;
  color: inherit;
  text-decoration: none;

  &:hover {
    background: #f7f6f4;
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: -1px;
  }
`;

export const ItemContent = styled.span`
  display: block;
  min-width: 0;
  flex: 1;
`;

export const ItemMeta = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-subtle, #928c8e);
  font-size: 11px;
  font-weight: 650;

  & > time {
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
  }
`;

export const ItemTitle = styled.strong`
  display: flex;
  margin-top: 4px;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  line-height: 1.4;
`;

export const UnreadDot = styled.span`
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-primary, #d93b54);
`;

export const ItemMessage = styled.span`
  display: -webkit-box;
  overflow: hidden;
  margin-top: 3px;
  color: var(--color-text-muted, #696466);
  font-size: 13px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const EmptyState = styled.div`
  display: flex;
  min-height: 230px;
  padding: 32px 24px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  text-align: center;
`;

export const EmptyIcon = styled.span`
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 6px;
  place-items: center;
  border-radius: 16px;
  background: var(--color-primary-soft, #fff1f3);
  color: var(--color-primary, #d93b54);
  font-size: 20px;
  font-weight: 800;
`;

export const EmptyDescription = styled.p`
  margin: 0;
  color: var(--color-text-muted, #696466);
  font-size: 13px;
  line-height: 1.6;
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: #b72e3f;
  font-size: 14px;
  line-height: 1.6;
`;

export const RetryButton = styled.button`
  margin-top: 8px;
  padding: 9px 15px;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary, #d93b54);
  color: #ffffff;
  font-weight: 750;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-hover, #c73149);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }
`;

export const LoadingItem = styled.div`
  height: 84px;
  margin: 6px 4px;
  border-radius: 13px;
  background: linear-gradient(100deg, #f2f0ee 20%, #faf9f8 38%, #f2f0ee 56%);
  background-size: 220% 100%;
  animation: notification-shimmer 1.4s ease-in-out infinite;

  @keyframes notification-shimmer {
    to {
      background-position-x: -220%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Footer = styled.footer`
  padding: 10px 16px 14px;
  border-top: 1px solid var(--color-border-subtle, #f0eeec);
`;

export const ViewAllLink = styled(Link)`
  display: flex;
  min-height: 40px;
  padding: 0 12px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 11px;
  color: var(--color-primary, #d93b54);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;

  &:hover {
    background: var(--color-primary-soft, #fff1f3);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 1px;
  }
`;
