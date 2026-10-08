import { lazy, Suspense } from 'react';
import {
  type Location,
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
import { HomePage } from '@/routes/home';
import { GlobalStyles } from '@/shared/ui/GlobalStyles';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

const SearchRoute = lazy(async () => {
  const routeModule = await import('@/routes/search/route');

  return { default: routeModule.SearchRoute };
});

const StoreDetailRoute = lazy(async () => {
  const routeModule = await import('@/routes/stores.$storeId/route');

  return { default: routeModule.StoreDetailRoute };
});

const TradeRoute = lazy(async () => {
  const routeModule = await import('@/routes/trade/route');

  return { default: routeModule.TradeRoute };
});

const TradeDetailRoute = lazy(async () => {
  const routeModule = await import('@/routes/tradeDetail/route');

  return { default: routeModule.TradeDetailRoute };
});

const TradeCreatePage = lazy(async () => await import('@/routes/tradeCreate'));

const TradeEditRoute = lazy(async () => {
  const routeModule = await import('@/routes/tradeEdit/route');

  return { default: routeModule.TradeEditRoute };
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

const ChatStartRoute = lazy(async () => {
  const routeModule = await import('@/routes/chat/route');

  return { default: routeModule.ChatStartRoute };
});

const NotificationsRoute = lazy(async () => {
  const routeModule = await import('@/routes/notifications/route');

  return { default: routeModule.NotificationsRoute };
});

const MyPageRoute = lazy(async () => {
  const routeModule = await import('@/routes/mypage/route');

  return { default: routeModule.MyPageRoute };
});

const ROOT_PATH = '/';
const ENTRY_PATH = '/trade';
const CATEGORY_SEARCH_PATH = '/search';
const MAP_PATH = '/map';
const STORE_ID_PATTERN = /^[1-9]\d*$/;
const TRADE_ID_PATTERN = /^[1-9]\d*$/;

function RedirectToEntry() {
  const { search, hash } = useLocation();

  return (
    <Navigate
      replace
      to={{
        pathname: ENTRY_PATH,
        search,
        hash,
      }}
    />
  );
}

function CategorySearchRoute() {
  const location = useLocation();
  const legacyGachaId = new URLSearchParams(location.search).get('gachaId');

  if (legacyGachaId && TRADE_ID_PATTERN.test(legacyGachaId)) {
    return (
      <Navigate
        replace
        to={{
          pathname: MAP_PATH,
          search: location.search,
          hash: location.hash,
        }}
      />
    );
  }

  return <HomePage />;
}

function CanonicalRoutes() {
  const location = useLocation();
  const backgroundLocation = getBackgroundLocation(location);

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
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path={ROOT_PATH} element={<RedirectToEntry />} />
        <Route path={CATEGORY_SEARCH_PATH} element={<CategorySearchRoute />} />
        <Route path={MAP_PATH} element={<SearchRoute />} />
        <Route path="/stores/:storeId" element={<StoreDetailRouteElement />} />
        <Route path="/trade" element={<TradeRoute />} />
        <Route path="/trade/:tradeId" element={<TradeDetailRouteElement />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/privacy" element={<PrivacyRoute />} />
        <Route
          path={`${OAUTH_CALLBACK_PATH_PREFIX}/:provider`}
          element={<AuthCallbackRouteElement />}
        />
        <Route element={<ProtectedRoutes />}>
          <Route path="/trade/new" element={<TradeCreatePage />} />
          <Route
            path="/trade/:tradeId/edit"
            element={<TradeEditRouteElement />}
          />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:roomId" element={<ChatRouteElement />} />
          <Route
            path="/chat/start/:tradeId"
            element={<ChatStartRouteElement />}
          />
          <Route path="/notifications" element={<NotificationsRoute />} />
          <Route path="/mypage" element={<MyPageRoute />} />
        </Route>
        <Route path="*" element={<RedirectToEntry />} />
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route element={<ProtectedRoutes />}>
            <Route
              path="/chat/:roomId"
              element={<ChatRouteElement presentation="modal" />}
            />
            <Route
              path="/chat/start/:tradeId"
              element={<ChatStartRouteElement modal />}
            />
          </Route>
        </Routes>
      )}
    </>
  );
}

function getBackgroundLocation(location: Location): Location | null {
  const state: unknown = location.state;

  if (
    typeof state !== 'object' ||
    state === null ||
    !('backgroundLocation' in state)
  ) {
    return null;
  }

  const backgroundLocation = state.backgroundLocation;

  return typeof backgroundLocation === 'object' && backgroundLocation !== null
    ? (backgroundLocation as Location)
    : null;
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
    return <RedirectToEntry />;
  }

  return <StoreDetailRoute pathname={`/stores/${storeId}`} />;
}

function TradeDetailRouteElement() {
  const { tradeId } = useParams<'tradeId'>();

  if (!tradeId || !TRADE_ID_PATTERN.test(tradeId)) {
    return <RedirectToEntry />;
  }

  return <TradeDetailRoute tradeId={Number(tradeId)} />;
}

function TradeEditRouteElement() {
  const { tradeId } = useParams<'tradeId'>();

  if (!tradeId || !TRADE_ID_PATTERN.test(tradeId)) {
    return <RedirectToEntry />;
  }

  return <TradeEditRoute tradeId={Number(tradeId)} />;
}

interface ChatRouteElementProps {
  presentation?: 'drawer' | 'modal';
}

function ChatRouteElement({ presentation }: ChatRouteElementProps) {
  const { roomId } = useParams<'roomId'>();

  if (!roomId || !TRADE_ID_PATTERN.test(roomId)) {
    return <Navigate replace to="/chat" />;
  }

  return (
    <ChatRoute
      roomId={Number(roomId)}
      {...(presentation ? { presentation } : {})}
    />
  );
}

interface ChatStartRouteElementProps {
  modal?: boolean;
}

function ChatStartRouteElement({ modal = false }: ChatStartRouteElementProps) {
  const { tradeId } = useParams<'tradeId'>();

  if (!tradeId || !TRADE_ID_PATTERN.test(tradeId)) {
    return <Navigate replace to="/trade" />;
  }

  return <ChatStartRoute tradeId={Number(tradeId)} modal={modal} />;
}

function AuthCallbackRouteElement() {
  const { provider } = useParams<'provider'>();

  if (!provider || !isOAuthProvider(provider)) {
    return <RedirectToEntry />;
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
