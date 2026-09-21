import type { ReactNode } from 'react';

import {
  Brand,
  BrandIcon,
  Header,
  HeaderContent,
  Navigation,
  NavigationLink,
  SearchArea,
} from './AppHeader.styles';

export interface AppHeaderProps {
  currentPath: string;
  search: ReactNode;
}

const NAVIGATION_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/search', label: '지도' },
  { href: '/used-market', label: '중고거래' },
] as const;

export function AppHeader({ currentPath, search }: AppHeaderProps) {
  return (
    <Header>
      <HeaderContent>
        <Brand href="/" aria-label="GachiGacha 홈">
          <BrandIcon viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M8 3.5h12v5H8zM5 8.5h18v16H5z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M10 15h8M14 11v8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </BrandIcon>
          <span>GachiGacha</span>
        </Brand>

        <SearchArea>{search}</SearchArea>

        <Navigation aria-label="주요 메뉴">
          {NAVIGATION_ITEMS.map(({ href, label }) => {
            const isActive = currentPath === href;

            return (
              <NavigationLink
                key={href}
                href={href}
                $isActive={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </NavigationLink>
            );
          })}
        </Navigation>
      </HeaderContent>
    </Header>
  );
}
