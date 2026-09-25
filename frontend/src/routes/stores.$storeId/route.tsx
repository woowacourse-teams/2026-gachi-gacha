import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';
import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
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
  VisuallyHidden,
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

function openGachaSearchResults(gachaId: number) {
  window.location.assign(createGachaSearchResultsUrl(gachaId));
}

export interface StoreDetailRouteProps {
  pathname?: string;
}

export function StoreDetailRoute({
  pathname = window.location.pathname,
}: StoreDetailRouteProps = {}) {
  const storeId = getStoreId(pathname);
  const { storeDetailState, retryStoreDetail } = useStoreDetail(storeId);

  return (
    <Page>
      <VisuallyHidden>매장 상세</VisuallyHidden>
      <AppHeader
        currentPath=""
        search={<GachaSearchBar onSelect={openGachaSearchResults} />}
      />

      {storeDetailState.status === 'loading' ? (
        <LoadingArea role="status" aria-label="매장 정보를 불러오는 중">
          <LoadingLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
        </LoadingArea>
      ) : storeDetailState.status === 'success' ? (
        <Main>
          <StoreDetailOverview store={storeDetailState.data} />
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
            <RetryButton type="button" onClick={retryStoreDetail}>
              다시 시도
            </RetryButton>
          )}
        </ErrorPanel>
      )}
    </Page>
  );
}
