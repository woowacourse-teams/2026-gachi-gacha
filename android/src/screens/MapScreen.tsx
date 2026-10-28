import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { isKakaoMapConfigured } from '../config/maps';
import { MapAffiliateCatalogButton } from '../domains/affiliate/AffiliateCatalogPlacement';
import { NearbyStoreCard } from '../domains/store/NearbyStoreCard';
import { NearbyStoreMap } from '../domains/store/NearbyStoreMap';
import type { MapCoordinate, NearbyStore } from '../domains/store/storeTypes';
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
const HONGDAE_RETURN_DISTANCE_METERS = 700;

function CarouselSeparator() {
  return <View style={styles.carouselSeparator} />;
}

function calculateDistanceInMeters(first: MapCoordinate, second: MapCoordinate): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) *
    Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function MapScreen({ navigation, route }: Props) {
  const gachaId = route.params?.gachaId ?? null;
  const gachaName = route.params?.gachaName;
  const gachaCategories = route.params?.gachaCategories ?? [];
  const [isMapAwayFromHongdae, setIsMapAwayFromHongdae] = useState(false);
  const [recenterRequestId, setRecenterRequestId] = useState(0);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList<NearbyStore>>(null);
  const { width } = useWindowDimensions();
  const result = useNearbyStores(gachaId, HONGDAE_SEARCH_CENTER);
  const canShowMap = isKakaoMapConfigured();
  const storeCardWidth = Math.max(
    260,
    width - CAROUSEL_HORIZONTAL_INSET * 2,
  );
  const hasStoreCarousel = result.status === 'success' && result.stores.length > 0;

  useEffect(() => {
    setSelectedStoreId(null);
    setCurrentCarouselIndex(0);
    setIsMapAwayFromHongdae(false);
    setRecenterRequestId((requestId) => requestId + 1);
  }, [gachaId]);

  useEffect(() => {
    if (selectedStoreId === null) return;

    const selectedIndex = result.stores.findIndex(
      ({ storeId }) => storeId === selectedStoreId,
    );
    if (selectedIndex < 0) {
      setSelectedStoreId(null);
      return;
    }

    setCurrentCarouselIndex(selectedIndex);
    carouselRef.current?.scrollToOffset({
      animated: true,
      offset: selectedIndex * (storeCardWidth + CAROUSEL_GAP),
    });
  }, [result.stores, selectedStoreId, storeCardWidth]);

  function openStoreDetail(store: NearbyStore) {
    navigation.navigate('StoreDetail', {
      storeId: store.storeId,
      storeName: store.name,
      latitude: store.latitude,
      longitude: store.longitude,
    });
  }

  function clearGachaSelection() {
    setSelectedStoreId(null);
    navigation.setParams({
      gachaCategories: undefined,
      gachaId: undefined,
      gachaName: undefined,
    });
  }

  function selectStore(store: NearbyStore) {
    if (selectedStoreId === store.storeId) {
      openStoreDetail(store);
      return;
    }

    setSelectedStoreId(store.storeId);
  }

  function syncCarouselSelection(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (result.status !== 'success' || result.stores.length === 0) return;

    const interval = storeCardWidth + CAROUSEL_GAP;
    const index = Math.min(
      result.stores.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.x / interval)),
    );
    const store = result.stores[index];

    setCurrentCarouselIndex(index);
    if (store && store.storeId !== selectedStoreId) {
      setSelectedStoreId(store.storeId);
    }
  }

  function handleCameraMoveEnd(center: MapCoordinate) {
    setIsMapAwayFromHongdae(
      calculateDistanceInMeters(center, HONGDAE_SEARCH_CENTER) >
        HONGDAE_RETURN_DISTANCE_METERS,
    );
  }

  function returnToHongdae() {
    setSelectedStoreId(null);
    setIsMapAwayFromHongdae(false);
    setRecenterRequestId((requestId) => requestId + 1);
  }

  const heading = gachaId === null
    ? '홍대 주변 가챠 매장'
    : gachaName
      ? `‘${gachaName}’ 보유 매장`
      : '선택한 가챠 보유 매장';

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.mapStage}>
        {canShowMap ? (
          <NearbyStoreMap
            center={HONGDAE_SEARCH_CENTER}
            onCameraMoveEnd={handleCameraMoveEnd}
            onSelectStore={selectStore}
            recenterRequestId={recenterRequestId}
            selectedStoreId={selectedStoreId}
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
                기본 탐색 지역 · 홍대
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
            <View style={styles.summaryActions}>
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
              <MapAffiliateCatalogButton
                categoryNames={gachaCategories}
                placementPath="/map"
                title={gachaName}
              />
            </View>
          )}
        </View>

        {isMapAwayFromHongdae && (
          <Pressable
            accessibilityLabel="지도를 홍대 중심으로 되돌리기"
            accessibilityRole="button"
            onPress={returnToHongdae}
            style={({ pressed }) => [
              styles.returnButton,
              hasStoreCarousel && styles.returnButtonAboveCarousel,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text aria-hidden style={styles.returnIcon}>↺</Text>
            <Text style={styles.returnText}>홍대로 돌아가기</Text>
          </Pressable>
        )}

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
                ? '홍대 주변에 등록된 가챠 매장이 없어요.'
                : '홍대 주변에는 이 가챠를 보유한 매장이 없어요.'}
            </Text>
          </View>
        )}

        {hasStoreCarousel && (
          <View style={styles.carouselArea}>
            <View accessibilityLiveRegion="polite" style={styles.carouselPosition}>
              <Text style={styles.carouselPositionText}>
                {currentCarouselIndex + 1}/{result.stores.length}
              </Text>
            </View>
            <FlatList
              contentContainerStyle={styles.carouselContent}
              data={result.stores}
              decelerationRate="fast"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                index,
                length: storeCardWidth + CAROUSEL_GAP,
                offset: (storeCardWidth + CAROUSEL_GAP) * index,
              })}
              horizontal
              ItemSeparatorComponent={CarouselSeparator}
              keyExtractor={({ storeId }) => String(storeId)}
              onMomentumScrollEnd={syncCarouselSelection}
              ref={carouselRef}
              renderItem={({ item }) => (
                <View style={{ width: storeCardWidth }}>
                  <NearbyStoreCard
                    selected={item.storeId === selectedStoreId}
                    store={item}
                    onPress={() => selectStore(item)}
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
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
  },
  clearConditionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  summaryActions: { marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  returnButton: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    minHeight: 46,
    paddingHorizontal: 15,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36, 33, 34, 0.12)',
    borderRadius: 23,
    backgroundColor: colors.background,
    elevation: 7,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },
  returnButtonAboveCarousel: {
    bottom: STORE_CARD_HEIGHT + 32,
  },
  returnIcon: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 24,
  },
  returnText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  buttonPressed: { opacity: 0.72 },
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
  },
  carouselSeparator: { width: CAROUSEL_GAP },
  carouselPosition: {
    minWidth: 44,
    height: 26,
    marginRight: CAROUSEL_HORIZONTAL_INSET,
    marginBottom: 7,
    paddingHorizontal: 10,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(36, 33, 34, 0.72)',
  },
  carouselPositionText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
