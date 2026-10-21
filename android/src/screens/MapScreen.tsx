import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { NearbyStoreCard } from '../domains/store/NearbyStoreCard';
import type { MapCoordinate } from '../domains/store/storeTypes';
import { useCurrentLocation } from '../domains/store/useCurrentLocation';
import { HONGDAE_SEARCH_CENTER, useNearbyStores } from '../domains/store/useNearbyStores';
import type { MapStackParamList } from '../navigation/MapStack';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<MapStackParamList, 'MapHome'>;

export function MapScreen({ navigation, route }: Props) {
  const gachaId = route.params?.gachaId ?? null;
  const gachaName = route.params?.gachaName;
  const [searchCenter, setSearchCenter] = useState<MapCoordinate>(HONGDAE_SEARCH_CENTER);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const location = useCurrentLocation();
  const result = useNearbyStores(gachaId, searchCenter);

  function clearGachaSelection() {
    navigation.setParams({ gachaId: undefined, gachaName: undefined });
  }

  async function searchFromCurrentLocation() {
    const coordinate = await location.requestCurrentLocation();
    if (!coordinate) return;

    setSearchCenter(coordinate);
    setIsCurrentLocation(true);
  }

  function resetToHongdae() {
    setSearchCenter(HONGDAE_SEARCH_CENTER);
    setIsCurrentLocation(false);
    location.reset();
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="지도" />
      <FlatList
        data={result.stores}
        keyExtractor={({ storeId }) => String(storeId)}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <NearbyStoreCard
            store={item}
            onPress={() => navigation.navigate('StoreDetail', {
              storeId: item.storeId,
              storeName: item.name,
              latitude: item.latitude,
              longitude: item.longitude,
            })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              현재 검색 지역 · {isCurrentLocation ? '내 위치' : '홍대'}
            </Text>
            <Text style={styles.heading}>
              {gachaId === null
                ? isCurrentLocation
                  ? '내 주변 가챠 매장'
                  : '홍대 주변 가챠 매장'
                : gachaName
                  ? `‘${gachaName}’ 보유 매장`
                  : '선택한 가챠 보유 매장'}
            </Text>
            <Text style={styles.description}>
              {isCurrentLocation ? '내 위치' : '홍대'} 중심 3km 안의 매장을 가까운 순서로 보여드려요.
            </Text>
            <View style={styles.locationActions}>
              <Pressable
                accessibilityRole="button"
                disabled={location.status === 'requesting'}
                onPress={() => void searchFromCurrentLocation()}
                style={({ pressed }) => [
                  styles.locationButton,
                  pressed && styles.locationButtonPressed,
                  location.status === 'requesting' && styles.buttonDisabled,
                ]}
              >
                {location.status === 'requesting'
                  ? <ActivityIndicator color={colors.background} />
                  : <Text style={styles.locationButtonText}>
                      {isCurrentLocation ? '현재 위치 새로고침' : '내 위치에서 찾기'}
                    </Text>}
              </Pressable>
              {isCurrentLocation && (
                <Pressable
                  accessibilityRole="button"
                  onPress={resetToHongdae}
                  style={({ pressed }) => [styles.areaResetButton, pressed && styles.clearButtonPressed]}
                >
                  <Text style={styles.clearButtonText}>홍대로 돌아가기</Text>
                </Pressable>
              )}
            </View>
            {location.errorMessage && (
              <Text accessibilityLiveRegion="polite" style={styles.locationError}>
                {location.errorMessage}
              </Text>
            )}
            {gachaId !== null && (
              <Pressable
                accessibilityRole="button"
                onPress={clearGachaSelection}
                style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
              >
                <Text style={styles.clearButtonText}>가챠 조건 지우고 전체 매장 보기</Text>
              </Pressable>
            )}
            {result.status === 'success' && (
              <Text style={styles.resultCount}>검색 결과 {result.stores.length}곳</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          result.status === 'loading' ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.stateText}>매장을 찾고 있어요...</Text>
            </View>
          ) : result.status === 'error' ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>{result.errorMessage}</Text>
              <Pressable onPress={result.retry} style={styles.retryButton}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {gachaId === null
                ? '현재 지역에서 확인할 수 있는 매장이 없어요.'
                : '현재 지역에는 이 가챠를 보유한 매장이 없어요.'}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
  },
  header: { paddingTop: 16, paddingBottom: 24 },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  heading: { marginTop: 9, color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  description: { marginTop: 9, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  locationActions: { marginTop: 17, flexDirection: 'row', gap: 8 },
  locationButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  locationButtonPressed: { backgroundColor: colors.primaryPressed },
  locationButtonText: { color: colors.background, fontSize: 13, fontWeight: '700' },
  areaResetButton: { minHeight: 46, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 14, backgroundColor: colors.background },
  buttonDisabled: { opacity: 0.6 },
  locationError: { marginTop: 10, color: colors.primary, fontSize: 12, lineHeight: 18 },
  clearButton: { minHeight: 44, marginTop: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 14, backgroundColor: colors.background },
  clearButtonPressed: { backgroundColor: colors.primarySoft },
  clearButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  resultCount: { marginTop: 22, color: colors.text, fontSize: 17, fontWeight: '800' },
  separator: { height: 12 },
  stateBox: { paddingVertical: 72, alignItems: 'center', gap: 16 },
  stateText: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  emptyText: { paddingVertical: 72, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
});
