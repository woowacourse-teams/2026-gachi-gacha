import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import type {
  NearbyStoreResponseDto,
  NearbyStoresResponseDto,
} from './api/nearbyStoresResponseType';
import { StoreListPanel } from './StoreListPanel';
import { StoreMapPanel } from './StoreMapPanel';
import {
  ListArea,
  ListHeaderArea,
  MapArea,
  Section,
} from './StoreResultsSection.styles';
import { useSelectedStore } from './useSelectedStore';

export interface StoreResultsSectionProps {
  center: MapCoordinate;
  listHeader?: ReactNode;
  storesState: AsyncState<NearbyStoresResponseDto>;
  isSearchAreaChanged: boolean;
  onOpenStore: (storeId: number) => void;
  onRetry: () => void;
  onSearchArea: () => void;
  onViewportCenterChange: (center: MapCoordinate) => void;
}

const EMPTY_STORES: readonly NearbyStoreResponseDto[] = [];

export function StoreResultsSection({
  center,
  listHeader,
  storesState,
  isSearchAreaChanged,
  onOpenStore,
  onRetry,
  onSearchArea,
  onViewportCenterChange,
}: StoreResultsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stores =
    storesState.status === 'success' ? storesState.data.stores : EMPTY_STORES;
  const { selectedStoreId, selectStore } = useSelectedStore(stores);
  const selectStoreAndRevealMap = useCallback(
    (storeId: number) => {
      selectStore(storeId);

      if (!window.matchMedia('(max-width: 767px)').matches) {
        return;
      }

      window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    },
    [selectStore],
  );

  return (
    <Section ref={sectionRef} aria-label="가챠 보유 매장 검색 결과">
      {listHeader && <ListHeaderArea>{listHeader}</ListHeaderArea>}
      <ListArea>
        <StoreListPanel
          storesState={storesState}
          selectedStoreId={selectedStoreId}
          onOpenStore={onOpenStore}
          onSelectStore={selectStoreAndRevealMap}
          onRetry={onRetry}
        />
      </ListArea>
      <MapArea>
        <StoreMapPanel
          center={center}
          storesState={storesState}
          selectedStoreId={selectedStoreId}
          isSearchAreaChanged={isSearchAreaChanged}
          onSelectStore={selectStoreAndRevealMap}
          onSearchArea={onSearchArea}
          onViewportCenterChange={onViewportCenterChange}
        />
      </MapArea>
    </Section>
  );
}
