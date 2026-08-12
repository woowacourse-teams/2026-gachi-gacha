import { useState } from 'react';
import styled from '@emotion/styled';

import KakaoMap from '@/components/kakaoMap/KakaoMap';
import StoreMarker from '@/components/kakaoMap/StoreMarker';
import { useNearbyStores } from '@/hooks/useNearbyStores';

const DEFAULT_CENTER = { lat: 37.5550659903951, lng: 126.925097731352 };

export default function MapPage() {
  const nearbyStores = useNearbyStores({
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  });
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const stores = nearbyStores.status === 'success' ? nearbyStores.stores : [];

  const toggleStore = (storeId: number) => {
    setSelectedStoreId((current) => (current === storeId ? null : storeId));
  };

  return (
    <PageLayout>
      <KakaoMap defaultCenter={DEFAULT_CENTER}>
        {stores.map((store) => (
          <StoreMarker
            key={store.storeId}
            position={{ lat: store.latitude, lng: store.longitude }}
            isSelected={store.storeId === selectedStoreId}
            onClick={() => toggleStore(store.storeId)}
          />
        ))}
      </KakaoMap>

      {nearbyStores.status === 'loading' && (
        <StatusBar>주변 매장을 불러오는 중입니다.</StatusBar>
      )}

      {nearbyStores.status === 'error' && (
        <StatusBar role="alert">{nearbyStores.error.message}</StatusBar>
      )}

      {nearbyStores.status === 'success' &&
        nearbyStores.stores.length === 0 && (
          <StatusBar>주변에 매장이 없습니다.</StatusBar>
        )}
    </PageLayout>
  );
}

const PageLayout = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const StatusBar = styled.p`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  margin: 0;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: rgb(0 0 0 / 70%);
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
`;
