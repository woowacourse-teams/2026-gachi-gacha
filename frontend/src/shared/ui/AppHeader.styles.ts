import styled from '@emotion/styled';
import { Link } from 'react-router';

function shouldForwardActiveLinkProp(propertyName: string) {
  return propertyName !== '$isActive';
}

function shouldForwardActionLinkProp(propertyName: string) {
  return propertyName !== '$isActive' && propertyName !== '$isAccount';
}

export const Header = styled.header`
  position: sticky;
  z-index: 40;
  top: 0;
  border-bottom: 2px solid var(--color-border, #e8e6e3);
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(12px);

  @media (max-width: 767px) {
    position: relative;
    top: auto;
  }
`;

export const HeaderContent = styled.div<{ $hasSearch: boolean }>`
  display: grid;
  min-height: 76px;
  padding: 12px 32px;
  align-items: center;
  grid-template-columns: minmax(210px, 1fr) minmax(280px, 720px) 258px auto;
  grid-template-areas: 'brand search navigation actions';
  column-gap: 20px;

  @media (max-width: 1180px) {
    min-height: 0;
    padding: 10px 20px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: ${({ $hasSearch }) =>
      $hasSearch ? '42px auto' : '42px 0'};
    grid-template-areas:
      'brand navigation actions'
      'search search search';
    column-gap: 18px;
    row-gap: ${({ $hasSearch }) => ($hasSearch ? '8px' : '0')};
  }

  @media (max-width: 520px) {
    padding: 10px 12px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: ${({ $hasSearch }) =>
      $hasSearch ? '38px auto' : '38px 0'};
    column-gap: 6px;
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
  display: grid;
  width: 258px;
  align-items: center;
  justify-content: flex-end;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: 1180px) {
    width: 228px;
  }

  @media (max-width: 520px) {
    width: 184px;
    gap: 2px;
  }

  @media (max-width: 360px) {
    width: 164px;
  }
`;

export const NavigationLink = styled(Link, {
  shouldForwardProp: shouldForwardActiveLinkProp,
})<{ $isActive: boolean }>`
  display: inline-flex;
  width: 100%;
  height: 42px;
  padding: 0 8px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ $isActive }) =>
    $isActive ? 'var(--color-primary, #d93b54)' : 'transparent'};
  color: ${({ $isActive }) =>
    $isActive ? '#ffffff' : 'var(--color-text-muted, #696466)'};
  font-size: 15px;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${({ $isActive }) =>
      $isActive
        ? 'var(--color-primary-hover, #c73149)'
        : 'var(--color-surface-muted, #faf9f8)'};
    color: ${({ $isActive }) =>
      $isActive ? '#ffffff' : 'var(--color-text, #242122)'};
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
  gap: 6px;

  @media (max-width: 520px) {
    gap: 2px;
  }
`;

export const ActionLink = styled(Link, {
  shouldForwardProp: shouldForwardActionLinkProp,
})<{
  $isActive: boolean;
  $isAccount?: boolean;
}>`
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

export const ActionIcon = styled.svg`
  width: 20px;
  height: 20px;
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
