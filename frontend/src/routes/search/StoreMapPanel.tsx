import { useEffect, useRef, useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';
import { KakaoMap } from '@/shared/map/KakaoMap';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import type {
  NearbyStoreResponseDto,
  NearbyStoresResponseDto,
} from './api/nearbyStoresResponseType';
import { useStoreMarkers } from './map/useStoreMarkers';
import { Panel, RefreshIcon, SearchAreaButton } from './StoreMapPanel.styles';

export interface StoreMapPanelProps {
  center: MapCoordinate;
  storesState: AsyncState<NearbyStoresResponseDto>;
  selectedStoreId: number | null;
  isSearchAreaChanged: boolean;
  onBackgroundClick: () => void;
  onMapDragEnd: () => void;
  onSelectStore: (storeId: number) => void;
  onViewportCenterChange: (center: MapCoordinate) => void;
  onSearchArea: () => void;
}

const EMPTY_STORES: readonly NearbyStoreResponseDto[] = [];

function useVisibleMapStores(
  storesState: AsyncState<NearbyStoresResponseDto>,
): readonly NearbyStoreResponseDto[] {
  const previousStoresRef = useRef(EMPTY_STORES);

  useEffect(() => {
    if (storesState.status === 'success') {
      previousStoresRef.current = storesState.data.stores;
    }
  }, [storesState]);

  if (storesState.status === 'success') {
    return storesState.data.stores;
  }

  if (storesState.status === 'loading') {
    return previousStoresRef.current;
  }

  return EMPTY_STORES;
}

function useVisibleMapCenter(
  storesState: AsyncState<NearbyStoresResponseDto>,
  requestedCenter: MapCoordinate,
): MapCoordinate {
  const previousCenterRef = useRef(requestedCenter);

  useEffect(() => {
    if (storesState.status !== 'loading') {
      previousCenterRef.current = requestedCenter;
    }
  }, [requestedCenter, storesState.status]);

  return storesState.status === 'loading'
    ? previousCenterRef.current
    : requestedCenter;
}

export function StoreMapPanel({
  center,
  storesState,
  selectedStoreId,
  isSearchAreaChanged,
  onBackgroundClick,
  onMapDragEnd,
  onSelectStore,
  onViewportCenterChange,
  onSearchArea,
}: StoreMapPanelProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const ignoreBackgroundClickRef = useRef(false);
  const stores = useVisibleMapStores(storesState);
  const selectedStore = stores.find(
    (store) => store.storeId === selectedStoreId,
  );
  const requestedCenter = selectedStore
    ? {
        latitude: selectedStore.latitude,
        longitude: selectedStore.longitude,
      }
    : center;
  const mapCenter = useVisibleMapCenter(storesState, requestedCenter);

  function selectStoreFromMarker(storeId: number) {
    ignoreBackgroundClickRef.current = true;
    onSelectStore(storeId);

    window.setTimeout(() => {
      ignoreBackgroundClickRef.current = false;
    }, 0);
  }

  function handleBackgroundClick() {
    if (ignoreBackgroundClickRef.current) {
      ignoreBackgroundClickRef.current = false;
      return;
    }

    onBackgroundClick();
  }

  useStoreMarkers({
    map,
    stores,
    selectedStoreId,
    onSelectStore: selectStoreFromMarker,
  });

  return (
    <Panel>
      <KakaoMap
        center={mapCenter}
        label="검색된 가챠 보유 매장 지도"
        onBackgroundClick={handleBackgroundClick}
        onDragEnd={onMapDragEnd}
        onMapReady={setMap}
        onViewportCenterChange={onViewportCenterChange}
      />
      {isSearchAreaChanged && (
        <SearchAreaButton type="button" onClick={onSearchArea}>
          <RefreshIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 7v5h-5M4 17v-5h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.2 9A7 7 0 0 0 6.4 6.4L4 9M5.8 15A7 7 0 0 0 17.6 17.6L20 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </RefreshIcon>
          이 지역에서 재검색
        </SearchAreaButton>
      )}
    </Panel>
  );
}
