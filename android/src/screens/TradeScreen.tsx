import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { useMemberSafety } from '../domains/memberSafety/MemberSafetyContext';
import { TradeCard } from '../domains/trade/TradeCard';
import { useTrades } from '../domains/trade/useTrades';
import type { TradeStatus } from '../domains/trade/tradeTypes';
import { colors } from '../theme/colors';
import type { TradeStackParamList } from '../navigation/TradeStack';

type Props = NativeStackScreenProps<TradeStackParamList, 'TradeList'>;

const statusFilters: Array<{ label: string; value: TradeStatus | null }> = [
  { label: '전체', value: null },
  { label: '교환 가능', value: 'AVAILABLE' },
  { label: '진행 중', value: 'IN_PROGRESS' },
  { label: '교환 완료', value: 'COMPLETED' },
];

const CONTENT_HORIZONTAL_PADDING = 14;
const CARD_GAP = 12;

export function TradeScreen({ navigation }: Props) {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tradeStatus, setTradeStatus] = useState<TradeStatus | null>(null);
  const { status: authStatus } = useAuthSession();
  const { blockedMemberIds } = useMemberSafety();
  const trades = useTrades(keyword, tradeStatus);
  const { width } = useWindowDimensions();
  const cardWidth = (width - CONTENT_HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
  const selectedStatusLabel = statusFilters.find(({ value }) => value === tradeStatus)?.label ?? '전체';
  const visibleTrades = trades.items.filter(({ memberId }) => !blockedMemberIds.has(memberId));

  return (
    <View style={styles.screen}>
      <AppHeader />
      <FlatList
        data={visibleTrades}
        keyExtractor={({ tradeId }) => String(tradeId)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <TradeCard
              trade={item}
              onPress={() => navigation.navigate('TradeDetail', { tradeId: item.tradeId })}
            />
          </View>
        )}
        onEndReached={() => void trades.loadMore()}
        onEndReachedThreshold={0.35}
        refreshControl={<RefreshControl refreshing={trades.isRefreshing} onRefresh={() => void trades.refresh()} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>어떤 거래글을 찾아볼까요?</Text>
            {authStatus === 'authenticated' && (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('BlockedMembers')}
                style={({ pressed }) => [styles.blockManagementButton, pressed && styles.blockManagementPressed]}
              >
                <Text style={styles.blockManagementText}>차단 관리</Text>
              </Pressable>
            )}
            <View style={styles.searchRow}>
              <TextInput
                accessibilityLabel="교환 게시글 검색어"
                autoCorrect={false}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => setKeyword(input.trim())}
                returnKeyType="search"
                placeholder="찾고 싶은 게시글을 검색"
                placeholderTextColor="#a1a1a8"
                style={styles.searchInput}
              />
              <Pressable onPress={() => setKeyword(input.trim())} style={({ pressed }) => [styles.searchButton, pressed && styles.searchPressed]}>
                <Text style={styles.searchButtonText}>검색</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.filterList}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {statusFilters.map((filter) => {
                const selected = filter.value === tradeStatus;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={filter.label}
                    onPress={() => setTradeStatus(filter.value)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.sectionTitle}>
              {keyword ? `‘${keyword}’ · ${selectedStatusLabel}` : `${selectedStatusLabel} · 최신순`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          trades.status === 'loading' ? (
            <View style={styles.stateBox}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.stateText}>교환 게시글을 불러오는 중...</Text></View>
          ) : trades.status === 'error' ? (
            <View style={styles.stateBox}><Text style={styles.stateText}>{trades.errorMessage}</Text><Pressable onPress={() => void trades.retry()} style={styles.retryButton}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>
          ) : (
            <Text style={styles.emptyText}>{keyword ? '검색어와 일치하는 게시글이 없어요.' : '아직 등록된 교환 게시글이 없어요.'}</Text>
          )
        }
        ListFooterComponent={
          <View>
            {trades.loadMoreErrorMessage && visibleTrades.length > 0 && (
              <View style={styles.loadMoreError}>
                <Text accessibilityLiveRegion="polite" style={styles.stateText}>
                  {trades.loadMoreErrorMessage}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void trades.retryLoadMore()}
                  style={styles.loadMoreRetry}
                >
                  <Text style={styles.loadMoreRetryText}>다시 불러오기</Text>
                </Pressable>
              </View>
            )}
            {trades.isLoadingMore && <ActivityIndicator color={colors.primary} style={styles.footerLoader} />}
          </View>
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
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  heading: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  blockManagementButton: { minHeight: 40, marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  blockManagementPressed: { backgroundColor: colors.primarySoft },
  blockManagementText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  searchRow: { marginTop: 18, flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.background, color: colors.text, fontSize: 14 },
  searchButton: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.primary },
  searchPressed: { backgroundColor: colors.primaryPressed },
  searchButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  filterScroll: { marginTop: 18, marginHorizontal: -14 },
  filterList: { paddingHorizontal: 14, gap: 8 },
  filterChip: { minHeight: 40, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.background },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterChipPressed: { opacity: 0.78 },
  filterChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  filterChipTextSelected: { color: colors.background },
  sectionTitle: { marginTop: 26, color: colors.text, fontSize: 18, fontWeight: '800' },
  row: { gap: 12, marginBottom: 12 },
  stateBox: { paddingVertical: 64, alignItems: 'center', gap: 16 },
  stateText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  retryButton: { minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  emptyText: { paddingVertical: 64, color: colors.textMuted, textAlign: 'center' },
  footerLoader: { marginVertical: 20 },
  loadMoreError: { marginVertical: 20, alignItems: 'center', gap: 10 },
  loadMoreRetry: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12 },
  loadMoreRetryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
