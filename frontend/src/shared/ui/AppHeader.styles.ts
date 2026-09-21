import styled from '@emotion/styled';

export const Header = styled.header`
  position: sticky;
  z-index: 40;
  top: 0;
  border-bottom: 2px solid var(--color-border, #e8e6e3);
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(12px);
`;

export const HeaderContent = styled.div`
  display: grid;
  min-height: 76px;
  padding: 12px 32px;
  align-items: center;
  grid-template-columns: minmax(180px, 1fr) minmax(280px, 720px) minmax(
      260px,
      1fr
    );
  gap: 28px;

  @media (max-width: 900px) {
    padding: 10px 20px;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'brand navigation'
      'search search';
    gap: 10px 18px;
  }

  @media (max-width: 520px) {
    padding: 10px 16px;
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

  @media (max-width: 900px) {
    grid-area: brand;
  }

  @media (max-width: 520px) {
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

  @media (max-width: 900px) {
    grid-area: search;
  }
`;

export const Navigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 900px) {
    grid-area: navigation;
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
    padding: 0 11px;
    font-size: 13px;
  }
`;
