import { createStoreDetailUrl } from '@/domains/store/storeRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';
import { AppHeader } from '@/shared/ui/AppHeader';

import { Page, PageTitle, SelectedGachaArea } from './route.styles';
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
  window.location.assign(createStoreDetailUrl(storeId));
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
  } = useStoreSearchArea(HONGDAE_SEARCH_CENTER);
  const storeSearchParams =
    selectedGachaId === null
      ? null
      : {
          gachaId: selectedGachaId,
          latitude: searchCenter.latitude,
          longitude: searchCenter.longitude,
          radius: STORE_SEARCH_RADIUS_METERS,
        };
  const { storesState, retryStores } = useSearchStores(storeSearchParams);

  function searchCurrentMapArea() {
    if (selectedGachaId !== null) {
      captureMapAreaResearched(selectedGachaId, STORE_SEARCH_RADIUS_METERS);
    }

    commitViewportCenter();
  }

  return (
    <Page>
      <PageTitle>가챠 보유 매장 검색 결과</PageTitle>
      <AppHeader
        currentPath="/search"
        search={<GachaSearchBar onSelect={selectGacha} />}
      />
      <StoreResultsSection
        center={searchCenter}
        gachaId={selectedGachaId}
        storesState={storesState}
        isSearchAreaChanged={isSearchAreaChanged}
        onOpenStore={openStoreDetail}
        onRetry={retryStores}
        onRevealHeader={revealPageHeader}
        onSearchArea={searchCurrentMapArea}
        onViewportCenterChange={updateViewportCenter}
        listHeader={
          selectedGacha.status === 'idle' ? null : (
            <SelectedGachaArea>
              <SelectedGachaSummary selectedGacha={selectedGacha} />
            </SelectedGachaArea>
          )
        }
      />
    </Page>
  );
}
