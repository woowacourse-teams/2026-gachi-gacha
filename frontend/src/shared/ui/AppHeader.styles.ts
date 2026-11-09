import styled from '@emotion/styled';
import { Link } from 'react-router';

function shouldForwardActiveLinkProp(propertyName: string) {
  return propertyName !== '$isActive';
}

function shouldForwardActionLinkProp(propertyName: string) {
  return propertyName !== '$isActive' && propertyName !== '$isAccount';
}

function shouldForwardActionButtonProp(propertyName: string) {
  return propertyName !== '$isActive';
}

export const Header = styled.header`
  position: sticky;
  z-index: 40;
  top: 0;
  border-bottom: 1px solid var(--color-border, #e8e6e3);
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(12px);

  @media (max-width: 767px) {
    position: relative;
    top: auto;

    nav[aria-label='사용자 메뉴'] > a:not([data-mobile-tab-action]),
    nav[aria-label='사용자 메뉴'] > div > button {
      border-color: transparent;
    }

    nav[aria-label='주요 메뉴'],
    [data-header-search-slot] {
      display: none;
    }

    &[data-mobile-variant='title'] {
      border-bottom: 0;
      & > div {
        min-height: 48px;
        padding: 0 14px 0 24px;
      }
      nav[aria-label='사용자 메뉴'] > div > button,
      nav[aria-label='사용자 메뉴'] > a {
        min-width: 44px;
        height: 44px;
      }
      [data-header-brand],
      [data-mobile-search-action] {
        display: none;
      }
    }

    &[data-mobile-variant='search'],
    &[data-mobile-variant='map'] {
      & > div {
        display: block;
        padding: 8px 12px;
      }
      & > div > :not([data-header-search-slot]) {
        display: none;
      }
      [data-header-search-slot] {
        display: block;
      }
    }

    &[data-mobile-variant='map'] {
      border: 0;
      background: transparent;
      backdrop-filter: none;
      & > div {
        padding: 0;
      }
      [data-header-search-slot] {
        pointer-events: auto;
      }
    }

    &[data-mobile-tabs] {
      border-bottom-width: 1px;

      nav[aria-label='주요 메뉴'],
      [data-mobile-tab-action] {
        display: none;
      }
    }
  }
`;

export const HeaderContent = styled.div`
  display: grid;
  min-height: 71px;
  box-sizing: border-box;
  padding: 8px 40px;
  align-items: center;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  grid-template-areas: 'brand navigation search actions';
  gap: 24px;

  @media (min-width: 768px) and (max-width: 1100px) {
    padding-inline: 20px;
    gap: 12px;
  }

  @media (min-width: 768px) and (max-width: 900px) {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'brand navigation actions' 'search search search';
    gap: 8px 12px;
  }

  @media (max-width: 767px) {
    min-height: 64px;
    padding: 10px 16px;
    grid-template-columns: 1fr auto;
    grid-template-areas: 'brand actions';
    gap: 8px;
  }
`;

export const Brand = styled(Link)`
  grid-area: brand;
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 10px;
  color: var(--color-primary, #d93b54);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;

  &:focus-visible {
    border-radius: 8px;
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 4px;
  }

  @media (max-width: 767px) {
    font-size: 0;
    gap: 0;
  }

  @media (max-width: 520px) {
    display: inline-flex;
  }
`;

export const BrandLogo = styled.img`
  width: auto;
  height: 29px;
  flex: 0 0 auto;
  object-fit: contain;
`;

export const SearchArea = styled.div`
  grid-area: search;
  width: 100%;
  min-width: 0;
`;

export const Navigation = styled.nav`
  grid-area: navigation;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const NavigationLink = styled(Link, {
  shouldForwardProp: shouldForwardActiveLinkProp,
})<{ $isActive: boolean }>`
  display: inline-flex;
  height: 40px;
  padding: 0 14px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: ${({ $isActive }) => ($isActive ? 'var(--color-primary-soft, #fff1f3)' : 'transparent')};
  color: ${({ $isActive }) =>
    $isActive
      ? 'var(--color-primary, #d93b54)'
      : 'var(--color-text-muted, #696466)'};
  font-size: 15px;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary-soft, #fff1f3)'
        : 'var(--color-surface-muted, #faf9f8)'};
    color: ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary, #d93b54)'
        : 'var(--color-text, #242122)'};
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }

  @media (max-width: 520px) {
    height: 38px;
    padding: 0 3px;
    font-size: 13px;
  }

  @media (max-width: 360px) {
    padding: 0 2px;
    font-size: 12px;
    letter-spacing: -0.04em;
  }
`;

export const Actions = styled.nav`
  grid-area: actions;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 520px) {
    gap: 2px;
  }
`;

export const NotificationMenu = styled.div`
  position: relative;
  display: inline-flex;
`;

export const ActionLink = styled(Link, {
  shouldForwardProp: shouldForwardActionLinkProp,
})<{
  $isActive: boolean;
  $isAccount?: boolean;
}>`
  position: relative;
  display: inline-flex;
  min-width: 42px;
  height: 42px;
  padding: ${({ $isAccount }) => ($isAccount ? '0 13px' : '0')};
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid
    ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary, #d93b54)'
        : 'var(--color-border, #e8e6e3)'};
  border-radius: 999px;
  background: ${({ $isActive }) =>
    $isActive ? 'var(--color-primary, #d93b54)' : '#ffffff'};
  color: ${({ $isActive }) =>
    $isActive ? '#ffffff' : 'var(--color-text, #242122)'};
  @media (min-width: 768px) {
    border-color: transparent;
    background: ${({ $isAccount, $isActive }) => ($isActive ? 'var(--color-primary, #d93b54)' : $isAccount ? '#f3f1ef' : 'transparent')};
  }

  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    border-color: ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary-hover, #c73149)'
        : 'var(--color-primary, #d93b54)'};
    background: ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary-hover, #c73149)'
        : 'var(--color-primary-soft, #fff1f3)'};
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }

  @media (max-width: 520px) {
    min-width: 36px;
    height: 36px;
    padding: ${({ $isAccount }) => ($isAccount ? '0 9px' : '0')};
    gap: 4px;
    font-size: 12px;
  }
`;

export const ActionButton = styled('button', {
  shouldForwardProp: shouldForwardActionButtonProp,
})<{ $isActive: boolean }>`
  position: relative;
  display: inline-flex;
  min-width: 42px;
  height: 42px;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid
    ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary, #d93b54)'
        : 'var(--color-border, #e8e6e3)'};
  border-radius: 999px;
  background: ${({ $isActive }) =>
    $isActive ? 'var(--color-primary, #d93b54)' : '#ffffff'};
  color: ${({ $isActive }) =>
    $isActive ? '#ffffff' : 'var(--color-text, #242122)'};
  cursor: pointer;

  @media (min-width: 768px) {
    border-color: transparent;
  }

  &:hover {
    border-color: var(--color-primary, #d93b54);
    background: ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary-hover, #c73149)'
        : 'var(--color-primary-soft, #fff1f3)'};
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 2px;
  }

  @media (max-width: 520px) {
    min-width: 36px;
    height: 36px;
  }
`;

export const ActionBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  place-items: center;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: var(--color-primary, #d93b54);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;

  @media (max-width: 520px) {
    top: -4px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
  }
`;

export const ActionIcon = styled.svg`
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
`;

export const AccountLabel = styled.span`
  @media (max-width: 360px) {
    display: none;
  }
`;

export const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`;

export const MobileTabBar = styled.nav`
  display: none;

  @media (max-width: 767px) {
    position: fixed;
    inset: auto 0 0;
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1px solid var(--color-border, #e8e6e3);
    background: white;
  }
`;

export const MobileTab = styled(Link)`
  position: relative;
  display: flex;
  min-height: var(--trade-mobile-tab-height, 56px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  color: inherit;
  font-size: 12px;
  text-decoration: none;

  &[aria-current='page'] {
    color: var(--color-primary, #bf4355);
    font-weight: 700;
  }

  & > span {
    right: auto;
    left: calc(50% + 3px);
  }
`;

export const MobileSearchLink = styled(Link)`
  display: none;
  color: inherit;
  @media (max-width: 767px) {
    display: grid;
    width: 40px;
    height: 40px;
    place-items: center;
  }
`;

export const WriteLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 4px;
  padding: 0 16px 0 12px;
  border-radius: 12px;
  background: var(--color-primary, #d93b54);
  color: white;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  @media (max-width: 767px) {
    display: none;
  }
`;

export const MobileNotificationLink = styled(ActionLink)`
  display: none;

  @media (max-width: 767px) {
    display: inline-flex;
  }
`;

export const DesktopSearch = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

export const MapSearchEntry = styled(Link)`
  display: none;
  @media (max-width: 767px) {
    display: flex;
    min-height: 44px;
    box-sizing: border-box;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1px solid var(--color-border, #e8e6e3);
    border-radius: 22px;
    background: white;
    color: #777173;
    font-size: 14px;
    text-decoration: none;
  }
`;

export const MobileTitle = styled.h1`
  display: none;
  @media (max-width: 767px) {
    grid-area: brand;
    display: block;
    margin: 0;
    color: var(--color-text, #242122);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
  }
`;
