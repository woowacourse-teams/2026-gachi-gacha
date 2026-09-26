import type { ReactNode } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { createLoginUrl } from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';

import {
  AccountLabel,
  ActionIcon,
  ActionLink,
  Actions,
  Avatar,
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

function ChatIcon() {
  return (
    <ActionIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 11.5a8 8 0 0 1-8.45 8L7 21l1.1-3.3A8 8 0 1 1 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </ActionIcon>
  );
}

function NotificationIcon() {
  return (
    <ActionIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </ActionIcon>
  );
}

function AccountIcon() {
  return (
    <ActionIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 20a6.5 6.5 0 0 1 13 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </ActionIcon>
  );
}

export function AppHeader({ currentPath, search }: AppHeaderProps) {
  const { status, member } = useAuthSession();
  const isAuthenticated = status === 'authenticated';
  const accountHref = isAuthenticated
    ? '/mypage'
    : createLoginUrl(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );

  function createProtectedHref(pathname: string): string {
    return isAuthenticated ? pathname : createLoginUrl(pathname);
  }

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

        <Actions aria-label="사용자 메뉴">
          <ActionLink
            href={createProtectedHref('/chat')}
            $isActive={currentPath === '/chat'}
            aria-label="채팅"
            title="채팅"
          >
            <ChatIcon />
          </ActionLink>
          <ActionLink
            href={createProtectedHref('/notifications')}
            $isActive={currentPath === '/notifications'}
            aria-label="알림"
            title="알림"
          >
            <NotificationIcon />
          </ActionLink>
          <ActionLink
            href={accountHref}
            $isActive={currentPath === '/mypage'}
            $isAccount
            aria-label={isAuthenticated ? '마이페이지' : '로그인'}
            title={isAuthenticated ? '마이페이지' : '로그인'}
          >
            {isAuthenticated && member?.profileImageUrl ? (
              <Avatar src={member.profileImageUrl} alt="" data-private-media />
            ) : (
              <AccountIcon />
            )}
            {!isAuthenticated && (
              <AccountLabel>
                {status === 'loading' ? '확인 중' : '로그인'}
              </AccountLabel>
            )}
          </ActionLink>
        </Actions>
      </HeaderContent>
    </Header>
  );
}
