import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { isKakaoMapConfigured } from '../config/maps';
import { NearbyStoreCard } from '../domains/store/NearbyStoreCard';
import { NearbyStoreMap } from '../domains/store/NearbyStoreMap';
import type { MapCoordinate, NearbyStore } from '../domains/store/storeTypes';
import { useCurrentLocation } from '../domains/store/useCurrentLocation';
import {
  HONGDAE_SEARCH_CENTER,
  useNearbyStores,
} from '../domains/store/useNearbyStores';
import type { MapStackParamList } from '../navigation/MapStack';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<MapStackParamList, 'MapHome'>;

const CAROUSEL_HORIZONTAL_INSET = 12;
const CAROUSEL_GAP = 10;
const STORE_CARD_HEIGHT = 124;

export function MapScreen({ navigation, route }: Props) {
  const gachaId = route.params?.gachaId ?? null;
  const gachaName = route.params?.gachaName;
  const [searchCenter, setSearchCenter] = useState<MapCoordinate>(
    HONGDAE_SEARCH_CENTER,
  );
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const { width } = useWindowDimensions();
  const location = useCurrentLocation();
  const result = useNearbyStores(gachaId, searchCenter);
  const canShowMap = isKakaoMapConfigured();
  const storeCardWidth = Math.max(
    260,
    width - CAROUSEL_HORIZONTAL_INSET * 2,
  );
  const hasStoreCarousel = result.status === 'success' && result.stores.length > 0;

  function openStoreDetail(store: NearbyStore) {
    navigation.navigate('StoreDetail', {
      storeId: store.storeId,
      storeName: store.name,
      latitude: store.latitude,
      longitude: store.longitude,
    });
  }

  function clearGachaSelection() {
    navigation.setParams({ gachaId: undefined, gachaName: undefined });
  }

  async function moveToCurrentLocation() {
    const coordinate = await location.requestCurrentLocation();
    if (!coordinate) return;

    setSearchCenter(coordinate);
    setIsCurrentLocation(true);
  }

  const heading = gachaId === null
    ? isCurrentLocation
      ? '내 주변 가챠 매장'
      : '홍대 주변 가챠 매장'
    : gachaName
      ? `‘${gachaName}’ 보유 매장`
      : '선택한 가챠 보유 매장';

  return (
    <View style={styles.screen}>
      <AppHeader title="지도" />
      <View style={styles.mapStage}>
        {canShowMap ? (
          <NearbyStoreMap
            center={searchCenter}
            onSelectStore={openStoreDetail}
            showsUserLocation={isCurrentLocation}
            stores={result.stores}
          />
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.stateText}>지도를 불러올 수 없는 환경이에요.</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeadingRow}>
            <View style={styles.summaryCopy}>
              <Text style={styles.eyebrow}>
                {isCurrentLocation ? '현재 위치' : '기본 탐색 지역 · 홍대'}
              </Text>
              <Text numberOfLines={2} style={styles.heading}>{heading}</Text>
            </View>
            {result.status === 'success' && (
              <View style={styles.countPill}>
                <Text style={styles.countText}>{result.stores.length}곳</Text>
              </View>
            )}
          </View>
          {gachaId !== null && (
            <Pressable
              accessibilityRole="button"
              onPress={clearGachaSelection}
              style={({ pressed }) => [
                styles.clearConditionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text numberOfLines={1} style={styles.clearConditionText}>
                가챠 조건 지우기 ×
              </Text>
            </Pressable>
          )}
          {location.errorMessage && (
            <Text accessibilityLiveRegion="polite" style={styles.locationError}>
              {location.errorMessage}
            </Text>
          )}
        </View>

        <Pressable
          accessibilityLabel="내 현재 위치로 지도 이동"
          accessibilityRole="button"
          disabled={location.status === 'requesting'}
          onPress={() => void moveToCurrentLocation()}
          style={({ pressed }) => [
            styles.locationButton,
            hasStoreCarousel && styles.locationButtonAboveCarousel,
            pressed && styles.buttonPressed,
            location.status === 'requesting' && styles.buttonDisabled,
          ]}
        >
          {location.status === 'requesting' ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text aria-hidden style={styles.locationIcon}>◎</Text>
          )}
        </Pressable>

        {result.status === 'loading' && (
          <View style={styles.stateOverlay}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>주변 매장을 찾고 있어요.</Text>
          </View>
        )}
        {result.status === 'error' && (
          <View style={styles.stateOverlay}>
            <Text accessibilityLiveRegion="polite" style={styles.stateText}>
              {result.errorMessage}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={result.retry}
              style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        )}
        {result.status === 'success' && result.stores.length === 0 && (
          <View style={styles.stateOverlay}>
            <Text style={styles.stateText}>
              {gachaId === null
                ? '현재 지도 주변에 등록된 가챠 매장이 없어요.'
                : '현재 지도 주변에는 이 가챠를 보유한 매장이 없어요.'}
            </Text>
          </View>
        )}

        {hasStoreCarousel && (
          <View style={styles.carouselArea}>
            <FlatList
              contentContainerStyle={styles.carouselContent}
              data={result.stores}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                index,
                length: storeCardWidth + CAROUSEL_GAP,
                offset: (storeCardWidth + CAROUSEL_GAP) * index,
              })}
              horizontal
              keyExtractor={({ storeId }) => String(storeId)}
              renderItem={({ item }) => (
                <View style={{ width: storeCardWidth }}>
                  <NearbyStoreCard
                    store={item}
                    onPress={() => openStoreDetail(item)}
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={storeCardWidth + CAROUSEL_GAP}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapStage: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f3f1ed',
  },
  mapFallback: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f1ed',
  },
  summaryCard: {
    position: 'absolute',
    top: 12,
    right: 12,
    left: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 33, 34, 0.08)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 5,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  summaryHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  summaryCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  heading: {
    marginTop: 5,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  countPill: {
    minHeight: 30,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
  },
  countText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  clearConditionButton: {
    minHeight: 34,
    marginTop: 11,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
  },
  clearConditionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  locationError: {
    marginTop: 10,
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36, 33, 34, 0.12)',
    borderRadius: 24,
    backgroundColor: colors.background,
    elevation: 7,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },
  locationButtonAboveCarousel: {
    bottom: STORE_CARD_HEIGHT + 32,
  },
  locationIcon: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 31,
  },
  buttonPressed: { opacity: 0.72 },
  buttonDisabled: { opacity: 0.55 },
  stateOverlay: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    left: 14,
    minHeight: 96,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 33, 34, 0.08)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    elevation: 5,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  carouselArea: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    left: 0,
  },
  carouselContent: {
    paddingHorizontal: CAROUSEL_HORIZONTAL_INSET,
    gap: CAROUSEL_GAP,
  },
});
