import { useIsFocused } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GachiKakaoMapView } from '../../../modules/gachi-kakao-map';
import { colors } from '../../theme/colors';
import type { MapCoordinate, NearbyStore } from './storeTypes';

type Props = {
  center: MapCoordinate;
  onCameraMoveEnd: (center: MapCoordinate) => void;
  onSelectStore: (store: NearbyStore) => void;
  recenterRequestId: number;
  selectedStoreId: number | null;
  stores: NearbyStore[];
};

export function NearbyStoreMap({
  center,
  onCameraMoveEnd,
  onSelectStore,
  recenterRequestId,
  selectedStoreId,
  stores,
}: Props) {
  const isFocused = useIsFocused();
  const [hasMapError, setHasMapError] = useState(false);
  const [recoverySession, setRecoverySession] = useState(0);
  const markers = useMemo(() => stores.map(({ storeId, latitude, longitude }) => ({
      id: storeId,
      latitude,
      longitude,
      selected: storeId === selectedStoreId,
    })),
    [selectedStoreId, stores],
  );

  return (
    <View accessibilityLabel="주변 가챠 매장 지도" style={styles.mapFrame}>
      {!hasMapError ? (
        <GachiKakaoMapView
          active={isFocused}
          center={center}
          key={recoverySession}
          markers={markers}
          onCameraMoveEnd={({ nativeEvent }) => onCameraMoveEnd(nativeEvent)}
          onMapError={() => setHasMapError(true)}
          onMarkerPress={({ nativeEvent }) => {
            const selectedStore = stores.find(({ storeId }) => storeId === nativeEvent.id);
            if (selectedStore) onSelectStore(selectedStore);
          }}
          recenterRequestId={recenterRequestId}
          showsUserLocation={false}
          style={styles.map}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          {hasMapError && (
            <>
              <Text style={styles.errorText}>지도를 불러오지 못했어요.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setRecoverySession((session) => session + 1);
                  setHasMapError(false);
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Text style={styles.retryText}>지도 다시 불러오기</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#f3f1ed',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f1ed',
  },
  errorText: { color: colors.textMuted, fontSize: 13 },
  retryButton: {
    minHeight: 40,
    marginTop: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  retryButtonPressed: { opacity: 0.72 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});
