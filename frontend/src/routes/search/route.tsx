import { useLocation } from 'react-router';

import { createStoreDetailUrl } from '@/domains/store/storeRoute';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';
import { AppHeader } from '@/shared/ui/AppHeader';

import {
  Page,
  PageTitle,
  MobileHeaderLayer,
  ServiceAreaNotice,
  ServiceAreaTitle,
  MapSearchLink,
  SelectedGachaArea,
} from './route.styles';
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

export function SearchRoute({ search }: SearchRouteProps) {
  const location = useLocation();
  const activeSearch = search ?? location.search;
  const { selectedGachaId, selectedGacha } = useSearchResults(activeSearch);
  const {
    searchCenter,
    viewportCenter,
    isSearchAreaChanged,
    updateViewportCenter,
    commitViewportCenter,
  } = useStoreSearchArea(HONGDAE_SEARCH_CENTER);
  const storeSearchParams = {
    gachaId: selectedGachaId,
    latitude: searchCenter.latitude,
    longitude: searchCenter.longitude,
    radius: STORE_SEARCH_RADIUS_METERS,
  };
  const { storesState, retryStores } = useSearchStores(storeSearchParams);
  const isOutsideServiceArea =
    Math.hypot(
      (viewportCenter.latitude - HONGDAE_SEARCH_CENTER.latitude) * 111_000,
      (viewportCenter.longitude - HONGDAE_SEARCH_CENTER.longitude) * 88_000,
    ) > STORE_SEARCH_RADIUS_METERS;
  function searchCurrentMapArea() {
    captureMapAreaResearched(selectedGachaId, STORE_SEARCH_RADIUS_METERS);

    commitViewportCenter();
  }

  return (
    <Page>
      <PageTitle>
        {selectedGachaId === null
          ? '홍대 가챠 매장 지도'
          : '가챠 보유 매장 검색 결과'}
      </PageTitle>
      <MobileHeaderLayer>
        <AppHeader
          currentPath="/map"
          showMobileTabs
          search={
            <MapSearchLink
              to="/search?tab=gacha"
              state={{ searchFrom: '/map' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              교환글, 가챠, 매장 검색
            </MapSearchLink>
          }
        />
      </MobileHeaderLayer>
      <StoreResultsSection
        center={searchCenter}
        gachaId={selectedGachaId}
        affiliateCategoryNames={
          selectedGacha.status === 'success'
            ? selectedGacha.data.categories
            : []
        }
        affiliateTitle={
          selectedGacha.status === 'success' ? selectedGacha.data.name : ''
        }
        storesState={storesState}
        isSearchAreaChanged={isSearchAreaChanged}
        onOpenStore={openStoreDetail}
        onRetry={() => {
          captureAnalyticsEvent('recovery_action_selected', {
            feature: 'store_search',
          });
          retryStores();
        }}
        onToggleHeader={() => undefined}
        onSearchArea={searchCurrentMapArea}
        onViewportCenterChange={updateViewportCenter}
        listHeader={
          isOutsideServiceArea ? (
            <ServiceAreaNotice>
              <ServiceAreaTitle>이 지역은 준비 중이에요</ServiceAreaTitle>
            </ServiceAreaNotice>
          ) : selectedGacha.status === 'idle' ? null : (
            <SelectedGachaArea>
              <SelectedGachaSummary selectedGacha={selectedGacha} />
            </SelectedGachaArea>
          )
        }
      />
    </Page>
  );
}
