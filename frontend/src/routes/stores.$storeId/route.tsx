import { useEffect } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { AppHeader } from '@/shared/ui/AppHeader';

import { StoreDetailOverview } from './components/StoreDetailOverview';
import {
  ErrorDescription,
  ErrorPanel,
  ErrorTitle,
  LoadingArea,
  LoadingLogo,
  Main,
  Page,
  RetryButton,
  DesktopHeader,
  MobileHeader,
  BackLink,
} from './route.styles';
import { useStoreDetail } from './useStoreDetail';

function getStoreId(pathname: string): number | null {
  const match = /^\/stores\/([1-9]\d*)\/?$/.exec(pathname);

  if (!match) {
    return null;
  }

  const storeId = Number(match[1]);

  return Number.isSafeInteger(storeId) ? storeId : null;
}

export interface StoreDetailRouteProps {
  pathname?: string;
}

export function StoreDetailRoute({
  pathname = window.location.pathname,
}: StoreDetailRouteProps = {}) {
  const storeId = getStoreId(pathname);
  const { storeDetailState, retryStoreDetail } = useStoreDetail(storeId);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [storeId]);

  return (
    <Page>
      <DesktopHeader>
        <AppHeader currentPath="" />
      </DesktopHeader>
      <MobileHeader>
        <BackLink to="/map" aria-label="지도로 돌아가기">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m15 5-7 7 7 7" />
          </svg>
        </BackLink>
      </MobileHeader>

      {storeDetailState.status === 'loading' ? (
        <LoadingArea role="status" aria-label="매장 정보를 불러오는 중">
          <LoadingLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
        </LoadingArea>
      ) : storeDetailState.status === 'success' ? (
        <Main>
          <StoreDetailOverview key={storeId} store={storeDetailState.data} />
        </Main>
      ) : (
        <ErrorPanel>
          <ErrorTitle>매장 정보를 보여드리지 못했어요</ErrorTitle>
          <ErrorDescription>
            {storeDetailState.status === 'error'
              ? storeDetailState.errorMessage
              : '올바른 매장 주소인지 확인해 주세요.'}
          </ErrorDescription>
          {storeDetailState.status === 'error' && (
            <RetryButton
              type="button"
              onClick={() => {
                captureAnalyticsEvent('recovery_action_selected', {
                  feature: 'store_detail',
                });
                retryStoreDetail();
              }}
            >
              다시 시도
            </RetryButton>
          )}
        </ErrorPanel>
      )}
    </Page>
  );
}
