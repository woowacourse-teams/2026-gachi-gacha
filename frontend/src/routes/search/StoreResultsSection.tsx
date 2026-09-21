import type { ReactNode } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import type {
  NearbyStoreResponseDto,
  NearbyStoresResponseDto,
} from './api/nearbyStoresResponseType';
import { StoreListPanel } from './StoreListPanel';
import { StoreMapPanel } from './StoreMapPanel';
import { ListArea, MapArea, Section } from './StoreResultsSection.styles';
import { useSelectedStore } from './useSelectedStore';

export interface StoreResultsSectionProps {
  center: MapCoordinate;
  listHeader?: ReactNode;
  storesState: AsyncState<NearbyStoresResponseDto>;
  onRetry: () => void;
}

const EMPTY_STORES: readonly NearbyStoreResponseDto[] = [];

export function StoreResultsSection({
  center,
  listHeader,
  storesState,
  onRetry,
}: StoreResultsSectionProps) {
  const stores =
    storesState.status === 'success' ? storesState.data.stores : EMPTY_STORES;
  const { selectedStoreId, selectStore } = useSelectedStore(stores);

  return (
    <Section aria-label="가챠 보유 매장 검색 결과">
      <ListArea>
        {listHeader}
        <StoreListPanel
          storesState={storesState}
          selectedStoreId={selectedStoreId}
          onSelectStore={selectStore}
          onRetry={onRetry}
        />
      </ListArea>
      <MapArea>
        <StoreMapPanel
          center={center}
          storesState={storesState}
          selectedStoreId={selectedStoreId}
          onSelectStore={selectStore}
        />
      </MapArea>
    </Section>
  );
}
