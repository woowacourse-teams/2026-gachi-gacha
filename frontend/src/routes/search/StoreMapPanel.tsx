import { useState } from 'react';

import type { AsyncState } from '@/shared/hooks/asyncStateType';
import { KakaoMap } from '@/shared/map/KakaoMap';
import type { MapCoordinate } from '@/shared/map/mapCoordinateType';

import type {
  NearbyStoreResponseDto,
  NearbyStoresResponseDto,
} from './api/nearbyStoresResponseType';
import { useStoreMarkers } from './map/useStoreMarkers';
import { Panel } from './StoreMapPanel.styles';

export interface StoreMapPanelProps {
  center: MapCoordinate;
  storesState: AsyncState<NearbyStoresResponseDto>;
  selectedStoreId: number | null;
  onSelectStore: (storeId: number) => void;
}

const EMPTY_STORES: readonly NearbyStoreResponseDto[] = [];

export function StoreMapPanel({
  center,
  storesState,
  selectedStoreId,
  onSelectStore,
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
      />
    </Panel>
  );
}
