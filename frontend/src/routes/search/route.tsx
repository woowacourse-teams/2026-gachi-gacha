import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import { Page, PageTitle, SelectedGachaArea } from './route.styles';
import { SelectedGachaSummary } from './SelectedGachaSummary';
import { StoreResultsSection } from './StoreResultsSection';
import { useSearchResults } from './useSearchResults';
import { useSearchStores } from './useSearchStores';

export interface SearchRouteProps {
  search?: string;
}

const HONGDAE_SEARCH_CENTER = {
  latitude: 37.5563,
  longitude: 126.9236,
} satisfies MapCoordinate;

const STORE_SEARCH_RADIUS_METERS = 3000;

export function SearchRoute({
  search = window.location.search,
}: SearchRouteProps) {
  const { selectedGachaId, selectedGacha } = useSearchResults(search);
  const storeSearchParams =
    selectedGachaId === null
      ? null
      : {
          gachaId: selectedGachaId,
          latitude: HONGDAE_SEARCH_CENTER.latitude,
          longitude: HONGDAE_SEARCH_CENTER.longitude,
          radius: STORE_SEARCH_RADIUS_METERS,
        };
  const { storesState, retryStores } = useSearchStores(storeSearchParams);

  return (
    <Page>
      <PageTitle>가챠 보유 매장 검색 결과</PageTitle>
      <StoreResultsSection
        center={HONGDAE_SEARCH_CENTER}
        storesState={storesState}
        onRetry={retryStores}
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
