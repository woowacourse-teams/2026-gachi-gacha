import { lazy, Suspense, useEffect } from 'react';

import { parseOAuthCallbackProvider } from '@/features/auth/oauthCallbackPath';
import type { OAuthProvider } from '@/features/auth/oauthProviderType';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { GlobalStyles } from '@/shared/ui/GlobalStyles';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

const HomeRoute = lazy(async () => {
  const routeModule = await import('@/routes/home');

  return { default: routeModule.HomePage };
});

const SearchRoute = lazy(async () => {
  const routeModule = await import('@/routes/search/route');

  return { default: routeModule.SearchRoute };
});

const StoreDetailRoute = lazy(async () => {
  const routeModule = await import('@/routes/stores.$storeId/route');

  return { default: routeModule.StoreDetailRoute };
});

const UsedMarketRoute = lazy(async () => {
  const routeModule = await import('@/routes/used-market/route');

  return { default: routeModule.UsedMarketRoute };
});

const LoginRoute = lazy(async () => {
  const routeModule = await import('@/routes/login/route');

  return { default: routeModule.LoginRoute };
});

const PrivacyRoute = lazy(async () => {
  const routeModule = await import('@/routes/privacy/route');

  return { default: routeModule.PrivacyRoute };
});

const AuthCallbackRoute = lazy(async () => {
  const routeModule = await import('@/routes/auth-callback/route');

  return { default: routeModule.AuthCallbackRoute };
});

const ChatRoute = lazy(async () => {
  const routeModule = await import('@/routes/chat/route');

  return { default: routeModule.ChatRoute };
});

const NotificationsRoute = lazy(async () => {
  const routeModule = await import('@/routes/notifications/route');

  return { default: routeModule.NotificationsRoute };
});

const MyPageRoute = lazy(async () => {
  const routeModule = await import('@/routes/mypage/route');

  return { default: routeModule.MyPageRoute };
});

const HOME_PATH = '/';
const SEARCH_PATH = '/search';
const USED_MARKET_PATH = '/used-market';
const LOGIN_PATH = '/login';
const PRIVACY_PATH = '/privacy';
const CHAT_PATH = '/chat';
const NOTIFICATIONS_PATH = '/notifications';
const MY_PAGE_PATH = '/mypage';
const STORE_DETAIL_PATH_PATTERN = /^\/stores\/[1-9]\d*$/;

type AppRoute =
  | { page: 'home' }
  | { page: 'search' }
  | { page: 'storeDetail' }
  | { page: 'usedMarket' }
  | { page: 'login' }
  | { page: 'privacy' }
  | { page: 'chat' }
  | { page: 'notifications' }
  | { page: 'mypage' }
  | { page: 'authCallback'; provider: OAuthProvider };

function removeTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function resolveAppRoute(pathname: string): AppRoute {
  const normalizedPathname = removeTrailingSlash(pathname);

  if (normalizedPathname === HOME_PATH) {
    return { page: 'home' };
  }

  if (normalizedPathname === SEARCH_PATH) {
    return { page: 'search' };
  }

  if (normalizedPathname === USED_MARKET_PATH) {
    return { page: 'usedMarket' };
  }

  if (normalizedPathname === LOGIN_PATH) {
    return { page: 'login' };
  }

  if (normalizedPathname === PRIVACY_PATH) {
    return { page: 'privacy' };
  }

  if (normalizedPathname === CHAT_PATH) {
    return { page: 'chat' };
  }

  if (normalizedPathname === NOTIFICATIONS_PATH) {
    return { page: 'notifications' };
  }

  if (normalizedPathname === MY_PAGE_PATH) {
    return { page: 'mypage' };
  }

  if (STORE_DETAIL_PATH_PATTERN.test(normalizedPathname)) {
    return { page: 'storeDetail' };
  }

  const provider = parseOAuthCallbackProvider(normalizedPathname);

  if (provider) {
    return { page: 'authCallback', provider };
  }

  return { page: 'home' };
}

function createCanonicalUrl(pathname: string): string {
  return `${pathname}${window.location.search}${window.location.hash}`;
}

export default function App() {
  const route = resolveAppRoute(window.location.pathname);
  const canonicalPath =
    route.page === 'home'
      ? HOME_PATH
      : route.page === 'search'
        ? SEARCH_PATH
        : null;
  const shouldReplacePath =
    canonicalPath !== null && window.location.pathname !== canonicalPath;

  useEffect(() => {
    if (!shouldReplacePath || canonicalPath === null) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      '',
      createCanonicalUrl(canonicalPath),
    );
  }, [canonicalPath, shouldReplacePath]);

  const routeElement =
    route.page === 'home' ? (
      <HomeRoute />
    ) : route.page === 'storeDetail' ? (
      <StoreDetailRoute />
    ) : route.page === 'usedMarket' ? (
      <UsedMarketRoute />
    ) : route.page === 'login' ? (
      <LoginRoute />
    ) : route.page === 'privacy' ? (
      <PrivacyRoute />
    ) : route.page === 'authCallback' ? (
      <AuthCallbackRoute provider={route.provider} />
    ) : route.page === 'chat' ? (
      <RequireAuth>
        <ChatRoute />
      </RequireAuth>
    ) : route.page === 'notifications' ? (
      <RequireAuth>
        <NotificationsRoute />
      </RequireAuth>
    ) : route.page === 'mypage' ? (
      <RequireAuth>
        <MyPageRoute />
      </RequireAuth>
    ) : (
      <SearchRoute />
    );

  return (
    <>
      <GlobalStyles />
      <Suspense
        fallback={<PageLoadingFallback label="페이지를 준비하고 있어요." />}
      >
        {routeElement}
      </Suspense>
    </>
  );
}
