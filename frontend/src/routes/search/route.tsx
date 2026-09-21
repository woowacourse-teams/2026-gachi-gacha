import { createStoreDetailUrl } from '@/domains/store/storeRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';
import { AppHeader } from '@/shared/ui/AppHeader';

import { Page, PageTitle, SelectedGachaArea } from './route.styles';
import { SelectedGachaSummary } from './SelectedGachaSummary';
import { StoreResultsSection } from './StoreResultsSection';
import { useSearchResults } from './useSearchResults';
import { useSearchRouteNavigation } from './useSearchRouteNavigation';
import { useSearchStores } from './useSearchStores';
import { useStoreSearchArea } from './useStoreSearchArea';

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

  return (
    <Page>
      <PageTitle>가챠 보유 매장 검색 결과</PageTitle>
      <AppHeader
        currentPath="/search"
        search={<GachaSearchBar onSelect={selectGacha} />}
      />
      <StoreResultsSection
        center={searchCenter}
        storesState={storesState}
        isSearchAreaChanged={isSearchAreaChanged}
        onOpenStore={openStoreDetail}
        onRetry={retryStores}
        onSearchArea={commitViewportCenter}
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
