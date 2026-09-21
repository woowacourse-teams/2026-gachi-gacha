import { useState } from 'react';

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
  onSelectStore: (storeId: number) => void;
  onViewportCenterChange: (center: MapCoordinate) => void;
  onSearchArea: () => void;
}

const EMPTY_STORES: readonly NearbyStoreResponseDto[] = [];

export function StoreMapPanel({
  center,
  storesState,
  selectedStoreId,
  isSearchAreaChanged,
  onSelectStore,
  onViewportCenterChange,
  onSearchArea,
}: StoreMapPanelProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const stores =
    storesState.status === 'success' ? storesState.data.stores : EMPTY_STORES;
  const selectedStore = stores.find(
    (store) => store.storeId === selectedStoreId,
  );
  const mapCenter = selectedStore
    ? {
        latitude: selectedStore.latitude,
        longitude: selectedStore.longitude,
      }
    : center;

  useStoreMarkers({ map, stores, selectedStoreId, onSelectStore });

  return (
    <Panel>
      <KakaoMap
        center={mapCenter}
        label="검색된 가챠 보유 매장 지도"
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
