import { useIsFocused } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GachiKakaoMapView } from '../../../modules/gachi-kakao-map';
import type { MapCoordinate, NearbyStore } from './storeTypes';

type Props = {
  center: MapCoordinate;
  onSelectStore: (store: NearbyStore) => void;
  showsUserLocation: boolean;
  stores: NearbyStore[];
};

export function NearbyStoreMap({ center, onSelectStore, showsUserLocation, stores }: Props) {
  const isFocused = useIsFocused();
  const [hasMapError, setHasMapError] = useState(false);
  const markers = useMemo(
    () => stores.map(({ storeId, latitude, longitude }) => ({
      id: storeId,
      latitude,
      longitude,
    })),
    [stores],
  );

  if (hasMapError) return null;

  return (
    <View
      accessible
      accessibilityLabel="주변 가챠 매장 지도"
      style={styles.mapFrame}
    >
      <GachiKakaoMapView
        active={isFocused}
        center={center}
        markers={markers}
        onMapError={() => setHasMapError(true)}
        onMarkerPress={({ nativeEvent }) => {
          const selectedStore = stores.find(({ storeId }) => storeId === nativeEvent.id);
          if (selectedStore) onSelectStore(selectedStore);
        }}
        showsUserLocation={showsUserLocation}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    height: 320,
    marginTop: 16,
    overflow: 'hidden',
    borderRadius: 20,
  },
  map: {
    flex: 1,
  },
});
