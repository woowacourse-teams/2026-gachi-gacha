import { useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';

import type { NearbyStoresFailure } from '@/apis/store';
import ErrorNotice from '@/components/ErrorNotice';
import KakaoMap from '@/components/kakaoMap/KakaoMap';
import { revealPosition } from '@/components/kakaoMap/revealPosition';
import StoreMarker from '@/components/kakaoMap/StoreMarker';
import type { LatLngLiteral } from '@/components/kakaoMap/useKakaoMap';
import {
  BuildingFloorsOverlay,
  BuildingMarker,
  findBuildingOf,
  GACHA_BUILDINGS,
  GUKJE_ELECTRONICS_CENTER_FLOORS,
  type GachaBuilding,
} from '@/features/building';
import {
  getBottomSheetCoveredHeight,
  StoreDetailSheetContainer,
  useStoreDetailSheet,
} from '@/features/storeDetail';
import {
  useNearbyStores,
  type NearbyStoresState,
} from '@/hooks/useNearbyStores';
import {
  alpha,
  color,
  focusRing,
  fontSize,
  fontWeight,
  radius,
  shadow,
} from '@/styles/tokens';

const DEFAULT_CENTER = { lat: 37.5550659903951, lng: 126.925097731352 };

const STORE_ERROR_MESSAGE: Record<NearbyStoresFailure, string> = {
  offline: '인터넷 연결을 확인해주세요.',
  server: '매장 정보를 불러오지 못했습니다.',
};

interface MapSearchOverlayProps {
  hasSearchAreaChanged: boolean;
  onRetry: () => void;
  onSearch: () => void;
  state: NearbyStoresState;
}

function MapSearchOverlay({
  hasSearchAreaChanged,
  onRetry,
  onSearch,
  state,
}: MapSearchOverlayProps) {
  if (state.status === 'loading') {
    return <StatusBar role="status">주변 매장을 불러오는 중입니다.</StatusBar>;
  }

  if (hasSearchAreaChanged) {
    return (
      <SearchAreaButton type="button" onClick={onSearch}>
        이 지역에서 재검색
      </SearchAreaButton>
    );
  }

  if (state.status === 'error') {
    return (
      <StoreErrorNotice
        message={STORE_ERROR_MESSAGE[state.error]}
        onRetry={onRetry}
      />
    );
  }

  if (state.data.length === 0) {
    return <StatusBar role="status">주변에 매장이 없습니다.</StatusBar>;
  }

  return null;
}

export default function MapPage() {
  const [searchCenter, setSearchCenter] = useState(DEFAULT_CENTER);
  const [hasSearchAreaChanged, setHasSearchAreaChanged] = useState(false);
  const nearbyStores = useNearbyStores({
    latitude: searchCenter.lat,
    longitude: searchCenter.lng,
  });
  const {
    closeStoreDetail,
    collapseStoreDetail,
    isStoreOpen,
    requestCloseStoreDetail,
    selectStoreDetail,
    selection,
    setState,
    state,
  } = useStoreDetailSheet();

  const mapRef = useRef<kakao.maps.Map | null>(null);

  /** 층 화면을 열어 둔 건물. 안 열려 있으면 null. */
  const [openBuilding, setOpenBuilding] = useState<GachaBuilding | null>(null);

  const stores = nearbyStores.status === 'success' ? nearbyStores.data : [];

  /**
   * 건물에 속한 매장은 개별 마커로 그리지 않는다. 같은 좌표에 마커가 포개지는
   * 걸 없애려고 건물 마커를 두는 것이라, 밑에 그대로 깔면 달라지는 게 없다.
   */
  const standaloneStores = stores.filter(
    (store) => findBuildingOf(store) === null,
  );

  /** 이번 검색 결과에 매장이 잡힌 건물만 그린다. 반경 밖 건물까지 띄우지 않는다. */
  const visibleBuildings = GACHA_BUILDINGS.filter((building) =>
    stores.some(
      (store) => findBuildingOf(store)?.buildingId === building.buildingId,
    ),
  );

  const handleSearchCurrentArea = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();

    requestCloseStoreDetail();
    setSearchCenter({ lat: center.getLat(), lng: center.getLng() });
    setHasSearchAreaChanged(false);
  }, [requestCloseStoreDetail]);

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
        onMapDragEnd={() => setHasSearchAreaChanged(true)}
        onMapReady={(map) => {
          mapRef.current = map;
        }}
      >
        {visibleBuildings.map((building) => (
          <BuildingMarker
            key={building.buildingId}
            building={building}
            onClick={() => setOpenBuilding(building)}
          />
        ))}

        {standaloneStores.map((store) => {
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

      <MapSearchOverlay
        hasSearchAreaChanged={hasSearchAreaChanged}
        state={nearbyStores}
        onRetry={nearbyStores.retry}
        onSearch={handleSearchCurrentArea}
      />

      {openBuilding !== null && (
        <BuildingFloorsOverlay
          building={openBuilding}
          floors={GUKJE_ELECTRONICS_CENTER_FLOORS}
          onClose={() => setOpenBuilding(null)}
        />
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
  border-radius: ${radius.pill};
  background-color: ${alpha(color.ink, 70)};
  color: ${color.surface};
  font-size: ${fontSize.sm};
  white-space: nowrap;
`;

const StatusBar = styled.p`
  ${floatingBar}
  margin: 0;
  padding: 8px 16px;
`;

const SearchAreaButton = styled.button`
  ${floatingBar}
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid ${color.line};
  background-color: ${color.surface};
  box-shadow: ${shadow.float};
  color: ${color.ink};
  font-family: inherit;
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:focus-visible {
    outline: ${focusRing};
    outline-offset: 2px;
  }
`;

const StoreErrorNotice = styled(ErrorNotice)`
  ${floatingBar}
  padding: 6px 6px 6px 16px;
`;
