import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import type {
  NearbyStoreResponseDto,
  NearbyStoresResponseDto,
} from '../api/nearbyStoresResponseType';
import { captureStoreSelected } from './analytics/storeResultsAnalytics';
import { StoreListPanel } from './list/StoreListPanel';
import { StoreMapPanel } from './map/StoreMapPanel';
import {
  ListArea,
  ListHeaderArea,
  MapArea,
  Section,
} from './StoreResultsSection.styles';
import { useSelectedStore } from './useSelectedStore';

export interface StoreResultsSectionProps {
  center: MapCoordinate;
  gachaId: number | null;
  listHeader?: ReactNode;
  storesState: AsyncState<NearbyStoresResponseDto>;
  isSearchAreaChanged: boolean;
  onOpenStore: (storeId: number) => void;
  onRetry: () => void;
  onRevealHeader: () => void;
  onSearchArea: () => void;
  onViewportCenterChange: (center: MapCoordinate) => void;
}

const EMPTY_STORES: readonly NearbyStoreResponseDto[] = [];

export function StoreResultsSection({
  center,
  gachaId,
  listHeader,
  storesState,
  isSearchAreaChanged,
  onOpenStore,
  onRetry,
  onRevealHeader,
  onSearchArea,
  onViewportCenterChange,
}: StoreResultsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stores =
    storesState.status === 'success' ? storesState.data.stores : EMPTY_STORES;
  const { selectedStoreId, selectStore } = useSelectedStore(stores);
  const showMapAsMainContent = useCallback(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) {
      return;
    }

    sectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);
  const selectStoreFromList = useCallback(
    (storeId: number) => {
      if (gachaId !== null) {
        captureStoreSelected(gachaId, storeId, 'list');
      }

      selectStore(storeId);
      window.requestAnimationFrame(showMapAsMainContent);
    },
    [gachaId, selectStore, showMapAsMainContent],
  );
  const selectStoreFromMapMarker = useCallback(
    (storeId: number) => {
      if (gachaId !== null) {
        captureStoreSelected(gachaId, storeId, 'map_marker');
      }

      selectStore(storeId);
      window.requestAnimationFrame(showMapAsMainContent);
    },
    [gachaId, selectStore, showMapAsMainContent],
  );
  const toggleMobileHeader = useCallback(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) {
      return;
    }

    const mapTop = sectionRef.current?.getBoundingClientRect().top;

    if (mapTop !== undefined && mapTop > 1) {
      showMapAsMainContent();
      return;
    }

    onRevealHeader();
  }, [onRevealHeader, showMapAsMainContent]);

  return (
    <Section ref={sectionRef} aria-label="가챠 보유 매장 검색 결과">
      {listHeader && <ListHeaderArea>{listHeader}</ListHeaderArea>}
      <ListArea>
        <StoreListPanel
          storesState={storesState}
          selectedStoreId={selectedStoreId}
          onOpenStore={onOpenStore}
          onSelectStore={selectStoreFromList}
          onRetry={onRetry}
        />
      </ListArea>
      <MapArea>
        <StoreMapPanel
          center={center}
          storesState={storesState}
          selectedStoreId={selectedStoreId}
          isSearchAreaChanged={isSearchAreaChanged}
          onBackgroundClick={toggleMobileHeader}
          onMapDragEnd={showMapAsMainContent}
          onSelectStore={selectStoreFromMapMarker}
          onSearchArea={onSearchArea}
          onViewportCenterChange={onViewportCenterChange}
        />
      </MapArea>
    </Section>
  );
}
