import { lazy, Suspense } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';

import { OAUTH_CALLBACK_PATH_PREFIX } from '@/features/auth/oauthCallbackPath';
import { isOAuthProvider } from '@/features/auth/oauthProviderType';
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
const STORE_ID_PATTERN = /^[1-9]\d*$/;

function RedirectToHome() {
  const { search, hash } = useLocation();

  return (
    <Navigate
      replace
      to={{
        pathname: HOME_PATH,
        search,
        hash,
      }}
    />
  );
}

function CanonicalRoutes() {
  const location = useLocation();

  if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
    return (
      <Navigate
        replace
        to={{
          pathname: location.pathname.slice(0, -1),
          search: location.search,
          hash: location.hash,
        }}
      />
    );
  }

  return (
    <Routes>
      <Route path={HOME_PATH} element={<HomeRoute />} />
      <Route path="/search" element={<SearchRoute />} />
      <Route path="/stores/:storeId" element={<StoreDetailRouteElement />} />
      <Route path="/used-market" element={<UsedMarketRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/privacy" element={<PrivacyRoute />} />
      <Route
        path={`${OAUTH_CALLBACK_PATH_PREFIX}/:provider`}
        element={<AuthCallbackRouteElement />}
      />
      <Route element={<ProtectedRoutes />}>
        <Route path="/chat" element={<ChatRoute />} />
        <Route path="/notifications" element={<NotificationsRoute />} />
        <Route path="/mypage" element={<MyPageRoute />} />
      </Route>
      <Route path="*" element={<RedirectToHome />} />
    </Routes>
  );
}

function ProtectedRoutes() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

function StoreDetailRouteElement() {
  const { storeId } = useParams<'storeId'>();

  if (!storeId || !STORE_ID_PATTERN.test(storeId)) {
    return <RedirectToHome />;
  }

  return <StoreDetailRoute pathname={`/stores/${storeId}`} />;
}

function AuthCallbackRouteElement() {
  const { provider } = useParams<'provider'>();

  if (!provider || !isOAuthProvider(provider)) {
    return <RedirectToHome />;
  }

  return <AuthCallbackRoute provider={provider} />;
}

export default function App() {
  return (
    <>
      <GlobalStyles />
      <Suspense
        fallback={<PageLoadingFallback label="페이지를 준비하고 있어요." />}
      >
        <CanonicalRoutes />
      </Suspense>
    </>
  );
}
