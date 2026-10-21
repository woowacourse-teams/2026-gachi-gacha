import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { NearbyStoreCard } from '../domains/store/NearbyStoreCard';
import { useNearbyStores } from '../domains/store/useNearbyStores';
import type { AppTabParamList } from '../navigation/AppTabs';
import { colors } from '../theme/colors';

type Props = BottomTabScreenProps<AppTabParamList, 'Map'>;

export function MapScreen({ navigation, route }: Props) {
  const gachaId = route.params?.gachaId ?? null;
  const gachaName = route.params?.gachaName;
  const result = useNearbyStores(gachaId);

  function clearGachaSelection() {
    navigation.setParams({ gachaId: undefined, gachaName: undefined });
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="지도" />
      <FlatList
        data={result.stores}
        keyExtractor={({ storeId }) => String(storeId)}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <NearbyStoreCard store={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>현재 지원 지역 · 홍대</Text>
            <Text style={styles.heading}>
              {gachaId === null
                ? '홍대 주변 가챠 매장'
                : gachaName
                  ? `‘${gachaName}’ 보유 매장`
                  : '선택한 가챠 보유 매장'}
            </Text>
            <Text style={styles.description}>
              홍대 중심 3km 안의 매장을 가까운 순서로 보여드려요.
            </Text>
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
