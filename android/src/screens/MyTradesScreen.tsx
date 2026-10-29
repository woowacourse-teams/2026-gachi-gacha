import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TradeCard } from '../domains/trade/TradeCard';
import {
  type MyTradeFilter,
  useMyTrades,
} from '../domains/trade/useMyTrades';
import type { RootStackParamList } from '../navigation/RootStack';
import { useBottomContentPadding } from '../shared/useBottomContentPadding';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MyTrades'>;

const FILTERS: Array<{ label: string; value: MyTradeFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '교환 가능', value: 'AVAILABLE' },
  { label: '진행 중', value: 'IN_PROGRESS' },
  { label: '완료', value: 'COMPLETED' },
];

export function MyTradesScreen({ navigation }: Props) {
  const bottomContentPadding = useBottomContentPadding();
  const [filter, setFilter] = useState<MyTradeFilter>('ALL');
  const {
    hasMore,
    isLoadingMore,
    loadMore,
    loadMoreError,
    retry,
    state,
  } = useMyTrades(filter);

  function openTrade(tradeId: number) {
    navigation.navigate('Main', {
      screen: 'Trade',
      params: { screen: 'TradeDetail', params: { tradeId } },
    });
  }

  const filterBar = (
    <View style={styles.filterBar}>
      {FILTERS.map(({ label, value }) => {
        const selected = value === filter;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filterButton, selected && styles.filterButtonSelected]}
          >
            <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.screen}>
        {filterBar}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>내 교환글을 불러오고 있어요.</Text>
        </View>
      </View>
    );
  }

  if (state.status === 'error' || !state.data) {
    return (
      <View style={styles.screen}>
        {filterBar}
        <View style={styles.center}>
          <Text style={styles.stateTitle}>내 교환글을 불러오지 못했어요</Text>
          <Text style={styles.stateText}>{state.errorMessage}</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {filterBar}
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomContentPadding },
        ]}
        data={state.data.content}
        keyExtractor={({ tradeId }) => String(tradeId)}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.stateTitle}>해당 상태의 교환글이 없어요</Text>
            <Text style={styles.stateText}>다른 상태를 선택해 확인해 보세요.</Text>
          </View>
        )}
        ListFooterComponent={(
          <View style={styles.footer}>
            {loadMoreError && <Text style={styles.errorText}>{loadMoreError}</Text>}
            {hasMore && (
              <Pressable
                accessibilityRole="button"
                disabled={isLoadingMore}
                onPress={() => void loadMore()}
                style={styles.moreButton}
              >
                {isLoadingMore && <ActivityIndicator color={colors.primary} size="small" />}
                <Text style={styles.moreText}>
                  {isLoadingMore ? '불러오는 중...' : '더보기'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <TradeCard onPress={() => openTrade(item.tradeId)} trade={item} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  filterBar: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  filterButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
  },
  filterButtonSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: colors.background },
  listContent: { flexGrow: 1, padding: 16, gap: 16 },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyState: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: {
    minHeight: 44,
    marginTop: 4,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  footer: { minHeight: 24, alignItems: 'center', gap: 10 },
  errorText: { color: colors.primary, fontSize: 12, textAlign: 'center' },
  moreButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  moreText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});
