import { createStoreDetailUrl } from '@/domains/store/storeRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';
import { AppHeader } from '@/shared/ui/AppHeader';

import {
  Page,
  PageTitle,
  ServiceAreaDescription,
  ServiceAreaEyebrow,
  ServiceAreaNotice,
  ServiceAreaTitle,
  SelectedGachaArea,
} from './route.styles';
import { useSearchRouteNavigation } from './routing/useSearchRouteNavigation';
import { SelectedGachaSummary } from './selectedGacha/SelectedGachaSummary';
import { useSearchResults } from './selectedGacha/useSearchResults';
import { captureMapAreaResearched } from './storeResults/analytics/storeResultsAnalytics';
import { StoreResultsSection } from './storeResults/StoreResultsSection';
import { useSearchStores } from './storeResults/useSearchStores';
import { useStoreSearchArea } from './storeResults/useStoreSearchArea';

export interface SearchRouteProps {
  search?: string;
  onSelectGacha?: (gachaId: number) => void;
}

const HONGDAE_SEARCH_CENTER = {
  latitude: 37.5563,
  longitude: 126.9236,
} satisfies MapCoordinate;

const STORE_SEARCH_RADIUS_METERS = 3000;

function openStoreDetail(storeId: number) {
  assignBrowserLocation(createStoreDetailUrl(storeId));
}

function revealPageHeader() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function SearchRoute({ search, onSelectGacha }: SearchRouteProps) {
  const { activeSearch, selectGacha } = useSearchRouteNavigation(
    search,
    onSelectGacha,
  );
  const { selectedGachaId, selectedGacha } = useSearchResults(activeSearch);
  const {
    searchCenter,
    isSearchAreaChanged,
    updateViewportCenter,
    commitViewportCenter,
    resetSearchArea,
  } = useStoreSearchArea(HONGDAE_SEARCH_CENTER);
  const storeSearchParams = {
    gachaId: selectedGachaId,
    latitude: searchCenter.latitude,
    longitude: searchCenter.longitude,
    radius: STORE_SEARCH_RADIUS_METERS,
  };
  const { storesState, retryStores } = useSearchStores(storeSearchParams);

  function searchCurrentMapArea() {
    captureMapAreaResearched(selectedGachaId, STORE_SEARCH_RADIUS_METERS);

    commitViewportCenter();
  }

  function selectGachaInServiceArea(gachaId: number) {
    resetSearchArea(HONGDAE_SEARCH_CENTER);
    selectGacha(gachaId);
  }

  return (
    <Page>
      <PageTitle>
        {selectedGachaId === null
          ? '홍대 가챠 매장 지도'
          : '가챠 보유 매장 검색 결과'}
      </PageTitle>
      <AppHeader
        currentPath="/map"
        search={<GachaSearchBar onSelect={selectGachaInServiceArea} />}
      />
      <StoreResultsSection
        center={searchCenter}
        gachaId={selectedGachaId}
        storesState={storesState}
        isSearchAreaChanged={isSearchAreaChanged}
        onOpenStore={openStoreDetail}
        onRetry={() => {
          captureAnalyticsEvent('recovery_action_selected', {
            feature: 'store_search',
          });
          retryStores();
        }}
        onRevealHeader={revealPageHeader}
        onSearchArea={searchCurrentMapArea}
        onViewportCenterChange={updateViewportCenter}
        listHeader={
          selectedGacha.status === 'idle' ? (
            <ServiceAreaNotice>
              <ServiceAreaEyebrow>현재 지원 지역</ServiceAreaEyebrow>
              <ServiceAreaTitle>홍대 주변 매장을 보여드려요</ServiceAreaTitle>
              <ServiceAreaDescription>
                다른 지역의 가챠 매장도 차근차근 준비하고 있어요.
              </ServiceAreaDescription>
            </ServiceAreaNotice>
          ) : (
            <SelectedGachaArea>
              <SelectedGachaSummary selectedGacha={selectedGacha} />
            </SelectedGachaArea>
          )
        }
      />
    </Page>
  );
}
