import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { colors } from '../../theme/colors';
import type { MapCoordinate, NearbyStore } from './storeTypes';

type Props = {
  center: MapCoordinate;
  onSelectStore: (store: NearbyStore) => void;
  showsUserLocation: boolean;
  stores: NearbyStore[];
};

export function NearbyStoreMap({ center, onSelectStore, showsUserLocation, stores }: Props) {
  return (
    <MapView
      accessibilityLabel="주변 가챠 매장 지도"
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }}
      provider={PROVIDER_GOOGLE}
      showsMyLocationButton={false}
      showsUserLocation={showsUserLocation}
      style={styles.map}
    >
      {stores.map((store) => (
        <Marker
          coordinate={{ latitude: store.latitude, longitude: store.longitude }}
          description={store.address}
          key={store.storeId}
          onCalloutPress={() => onSelectStore(store)}
          pinColor={colors.primary}
          title={store.name}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 320,
    marginTop: 16,
    overflow: 'hidden',
    borderRadius: 20,
  },
});
