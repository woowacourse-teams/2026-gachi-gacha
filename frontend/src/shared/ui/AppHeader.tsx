import type { ReactNode } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo.png';

import {
  Brand,
  BrandLogo,
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
          <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
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
