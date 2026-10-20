import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { createLoginUrl } from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type { NavigationDestination } from '@/shared/analytics/analyticsEventType';

import {
  AccountLabel,
  ActionButton,
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
  NotificationBadge,
  NotificationMenu,
  SearchArea,
} from './AppHeader.styles';
import {
  type HeaderNotification,
  type HeaderNotificationState,
  NotificationPopover,
} from './NotificationPopover';

export interface AppHeaderProps {
  currentPath: string;
  notificationState?: HeaderNotificationState;
  onNotificationRetry?: () => void;
  onNotificationSelect?: (notification: HeaderNotification) => void;
  search?: ReactNode;
}

const EMPTY_NOTIFICATION_STATE: HeaderNotificationState = {
  status: 'success',
  data: [],
  errorMessage: null,
};

const NAVIGATION_ITEMS = [
  { href: '/trade', label: '거래/교환', destination: 'trade' },
  { href: '/map', label: '지도', destination: 'map' },
  { href: '/search', label: '검색', destination: 'search' },
] as const;

function captureHeaderNavigation(
  destination: NavigationDestination,
  isAuthenticated: boolean,
) {
  captureAnalyticsEvent('navigation_selected', {
    destination,
    source: 'header',
    is_authenticated: isAuthenticated,
  });
}

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

export function AppHeader({
  currentPath,
  notificationState = EMPTY_NOTIFICATION_STATE,
  onNotificationRetry,
  onNotificationSelect,
  search,
}: AppHeaderProps) {
  const { status, member } = useAuthSession();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPopoverId = useId();
  const notificationTitleId = useId();
  const isAuthenticated = status === 'authenticated';
  const accountHref = isAuthenticated
    ? '/mypage'
    : createLoginUrl(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );

  const unreadNotificationCount = useMemo(() => {
    if (notificationState.status !== 'success') {
      return 0;
    }

    return notificationState.data.filter(({ isRead }) => !isRead).length;
  }, [notificationState]);

  const closeNotificationPopover = useCallback((restoreFocus = false) => {
    setIsNotificationOpen(false);

    if (restoreFocus) {
      notificationButtonRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!isNotificationOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !notificationMenuRef.current?.contains(event.target)
      ) {
        closeNotificationPopover();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNotificationPopover(true);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeNotificationPopover, isNotificationOpen]);

  useEffect(() => {
    setIsNotificationOpen(false);
  }, [currentPath]);

  return (
    <Header>
      <HeaderContent $hasSearch={Boolean(search)}>
        <Brand
          to="/trade"
          aria-label="GachiGacha 거래/교환으로 이동"
          onClick={() => captureHeaderNavigation('brand', isAuthenticated)}
        >
          <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
          <span>GachiGacha</span>
        </Brand>

        <SearchArea data-header-search-slot>{search}</SearchArea>

        <Navigation aria-label="주요 메뉴">
          {NAVIGATION_ITEMS.map(({ href, label, destination }) => {
            const isActive = currentPath === href;

            return (
              <NavigationLink
                key={href}
                to={href}
                $isActive={isActive}
                aria-current={isActive ? 'page' : undefined}
                onClick={() =>
                  captureHeaderNavigation(destination, isAuthenticated)
                }
              >
                {label}
              </NavigationLink>
            );
          })}
        </Navigation>

        <Actions aria-label="사용자 메뉴">
          {isAuthenticated && (
            <>
              <ActionLink
                to="/chat"
                $isActive={currentPath === '/chat'}
                aria-label="채팅"
                title="채팅"
                onClick={() => captureHeaderNavigation('chat', isAuthenticated)}
              >
                <ChatIcon />
              </ActionLink>
              <NotificationMenu ref={notificationMenuRef}>
                <ActionButton
                  ref={notificationButtonRef}
                  type="button"
                  $isActive={isNotificationOpen}
                  aria-label={
                    unreadNotificationCount > 0
                      ? `알림, 읽지 않은 알림 ${unreadNotificationCount}개`
                      : '알림'
                  }
                  aria-controls={
                    isNotificationOpen ? notificationPopoverId : undefined
                  }
                  aria-expanded={isNotificationOpen}
                  aria-haspopup="dialog"
                  title="알림"
                  onClick={() => {
                    setIsNotificationOpen((isOpen) => !isOpen);
                    captureHeaderNavigation('notifications', isAuthenticated);
                  }}
                >
                  <NotificationIcon />
                  {unreadNotificationCount > 0 && (
                    <NotificationBadge aria-hidden="true">
                      {unreadNotificationCount > 99
                        ? '99+'
                        : unreadNotificationCount}
                    </NotificationBadge>
                  )}
                </ActionButton>
                {isNotificationOpen && (
                  <NotificationPopover
                    id={notificationPopoverId}
                    titleId={notificationTitleId}
                    notificationState={notificationState}
                    onClose={() => closeNotificationPopover(true)}
                    onNotificationSelect={onNotificationSelect}
                    onRetry={onNotificationRetry}
                  />
                )}
              </NotificationMenu>
            </>
          )}
          <ActionLink
            to={accountHref}
            $isActive={currentPath === '/mypage'}
            $isAccount
            aria-label={isAuthenticated ? '마이페이지' : '로그인'}
            title={isAuthenticated ? '마이페이지' : '로그인'}
            onClick={() =>
              captureHeaderNavigation(
                isAuthenticated ? 'mypage' : 'login',
                isAuthenticated,
              )
            }
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
