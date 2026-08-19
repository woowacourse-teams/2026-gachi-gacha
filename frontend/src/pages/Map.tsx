import { useCallback, useRef } from 'react';
import styled from '@emotion/styled';

import type { NearbyStoresFailure } from '@/apis/store';
import ErrorNotice from '@/components/ErrorNotice';
import KakaoMap from '@/components/kakaoMap/KakaoMap';
import { revealPosition } from '@/components/kakaoMap/revealPosition';
import StoreMarker from '@/components/kakaoMap/StoreMarker';
import type { LatLngLiteral } from '@/components/kakaoMap/useKakaoMap';
import {
  getBottomSheetCoveredHeight,
  StoreDetailSheetContainer,
  useStoreDetailSheet,
} from '@/features/storeDetail';
import { useNearbyStores } from '@/hooks/useNearbyStores';

const DEFAULT_CENTER = { lat: 37.5550659903951, lng: 126.925097731352 };

const STORE_ERROR_MESSAGE: Record<NearbyStoresFailure, string> = {
  offline: '인터넷 연결을 확인해주세요.',
  server: '매장 정보를 불러오지 못했습니다.',
};

export default function MapPage() {
  const nearbyStores = useNearbyStores({
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  });
  const {
    closeStoreDetail,
    collapseStoreDetail,
    isStoreOpen,
    selectStoreDetail,
    selection,
    setState,
    state,
  } = useStoreDetailSheet();

  const mapRef = useRef<kakao.maps.Map | null>(null);

  const stores = nearbyStores.status === 'success' ? nearbyStores.data : [];

  /** 마커를 눌러 시트가 열릴 때, 그 마커가 시트에 가리면 지도를 옮겨준다. */
  const handleMarkerClick = useCallback(
    (storeId: number, position: LatLngLiteral, distanceMeters: number) => {
      const opened = selectStoreDetail({ storeId, distanceMeters });
      const map = mapRef.current;

      if (!opened || !map) return;

      revealPosition(map, position, {
        coveredHeight: getBottomSheetCoveredHeight(
          'summary',
          map.getNode().clientHeight,
        ),
      });
    },
    [selectStoreDetail],
  );

  return (
    <PageLayout>
      <KakaoMap
        defaultCenter={DEFAULT_CENTER}
        onMapClick={collapseStoreDetail}
        onMapReady={(map) => {
          mapRef.current = map;
        }}
      >
        {stores.map((store) => {
          const position = { lat: store.latitude, lng: store.longitude };

          return (
            <StoreMarker
              key={store.storeId}
              position={position}
              isSelected={isStoreOpen(store.storeId)}
              onClick={() =>
                handleMarkerClick(store.storeId, position, store.distance)
              }
            />
          );
        })}
      </KakaoMap>

      {nearbyStores.status === 'loading' && (
        <StatusBar>주변 매장을 불러오는 중입니다.</StatusBar>
      )}

      {nearbyStores.status === 'error' && (
        <StoreErrorNotice
          message={STORE_ERROR_MESSAGE[nearbyStores.error]}
          onRetry={nearbyStores.retry}
        />
      )}

      {nearbyStores.status === 'success' && stores.length === 0 && (
        <StatusBar>주변에 매장이 없습니다.</StatusBar>
      )}

      <StoreDetailSheetContainer
        distanceMeters={selection?.distanceMeters}
        state={state}
        storeId={selection?.storeId ?? null}
        onClose={closeStoreDetail}
        onStateChange={setState}
      />
    </PageLayout>
  );
}

const PageLayout = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const floatingBar = `
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  border-radius: 20px;
  background-color: rgb(0 0 0 / 70%);
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
`;

const StatusBar = styled.p`
  ${floatingBar}
  margin: 0;
  padding: 8px 16px;
`;

const StoreErrorNotice = styled(ErrorNotice)`
  ${floatingBar}
  padding: 6px 6px 6px 16px;
`;
