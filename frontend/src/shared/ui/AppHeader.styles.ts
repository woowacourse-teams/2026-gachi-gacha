import styled from '@emotion/styled';

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

export const HeaderContent = styled.div`
  display: grid;
  min-height: 76px;
  padding: 12px 32px;
  align-items: center;
  grid-template-columns:
    minmax(210px, 0.8fr) minmax(280px, 720px) auto
    auto;
  gap: 20px;

  @media (max-width: 1180px) {
    padding: 10px 20px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'brand navigation actions'
      'search search search';
    gap: 10px 18px;
  }

  @media (max-width: 520px) {
    padding: 10px 12px;
    gap: 10px 6px;
  }
`;

export const Brand = styled.a`
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

  @media (max-width: 1180px) {
    grid-area: brand;
  }

  @media (max-width: 767px) {
    font-size: 0;
    gap: 0;
  }
`;

export const BrandLogo = styled.img`
  width: auto;
  height: 29px;
  flex: 0 0 auto;
  object-fit: contain;
`;

export const SearchArea = styled.div`
  width: 100%;
  min-width: 0;

  @media (max-width: 1180px) {
    grid-area: search;
  }
`;

export const Navigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 1180px) {
    grid-area: navigation;
  }

  @media (max-width: 520px) {
    gap: 2px;
  }
`;

export const NavigationLink = styled.a<{ $isActive: boolean }>`
  display: inline-flex;
  min-height: 42px;
  padding: 0 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ $isActive }) =>
    $isActive ? 'var(--color-primary, #d93b54)' : 'transparent'};
  color: ${({ $isActive }) =>
    $isActive ? '#ffffff' : 'var(--color-text-muted, #696466)'};
  font-size: 15px;
  font-weight: 750;
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
    min-height: 38px;
    padding: 0 8px;
    font-size: 13px;
  }
`;

export const Actions = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;

  @media (max-width: 1180px) {
    grid-area: actions;
  }

  @media (max-width: 520px) {
    gap: 2px;
  }
`;

export const ActionLink = styled.a<{
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

export const AccountLabel = styled.span``;

export const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`;
