import { useCallback, useRef, useState } from 'react';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import { TradeCreateButton } from '../components/TradeCreateButton';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { useMemberSafety } from '../domains/memberSafety/MemberSafetyContext';
import { TradeCard } from '../domains/trade/TradeCard';
import { useTrades } from '../domains/trade/useTrades';
import type { TradeSummary } from '../domains/trade/tradeTypes';
import { colors } from '../theme/colors';
import type { TradeStackParamList } from '../navigation/TradeStack';
import type { RootStackParamList } from '../navigation/RootStack';

type Props = NativeStackScreenProps<TradeStackParamList, 'TradeList'>;

const CONTENT_HORIZONTAL_PADDING = 14;
const CARD_GAP = 12;

export function TradeScreen({ navigation }: Props) {
  const listRef = useRef<FlatList<TradeSummary>>(null);
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const { status: authStatus } = useAuthSession();
  const { blockedMemberIds } = useMemberSafety();
  const trades = useTrades(keyword);
  const hasFocusedOnce = useRef(false);
  const refreshTradesRef = useRef(trades.refresh);
  refreshTradesRef.current = trades.refresh;
  const { width } = useWindowDimensions();
  const cardWidth = (width - CONTENT_HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
  const visibleTrades = trades.items.filter(({ memberId }) => !blockedMemberIds.has(memberId));
  const rootNavigation = navigation
    .getParent()
    ?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  function openTradeCreate() {
    navigation.navigate('TradeCreate');

    if (authStatus !== 'authenticated') {
      rootNavigation?.navigate('Login');
    }
  }

  useFocusEffect(useCallback(() => {
    if (hasFocusedOnce.current) {
      void refreshTradesRef.current();
    } else {
      hasFocusedOnce.current = true;
    }
  }, []));

  return (
    <View style={styles.screen}>
      <AppHeader />
      <FlatList
        ref={listRef}
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
        onScroll={({ nativeEvent }) => {
          setShowScrollToTop(nativeEvent.contentOffset.y > 520);
        }}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={trades.isRefreshing} onRefresh={() => void trades.refresh()} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>어떤 거래글을 찾아볼까요?</Text>
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
            <Text style={styles.sectionTitle}>
              {keyword ? `‘${keyword}’ 검색결과` : '최신순'}
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
            {trades.hasMore && !trades.loadMoreErrorMessage && (
              <Pressable
                accessibilityRole="button"
                disabled={trades.isLoadingMore}
                onPress={() => void trades.loadMore()}
                style={({ pressed }) => [
                  styles.moreButton,
                  pressed && styles.moreButtonPressed,
                  trades.isLoadingMore && styles.moreButtonDisabled,
                ]}
              >
                {trades.isLoadingMore && <ActivityIndicator color={colors.primary} size="small" />}
                <Text style={styles.moreButtonText}>
                  {trades.isLoadingMore ? '불러오는 중...' : '더보기'}
                </Text>
              </Pressable>
            )}
          </View>
        }
      />
      <ScrollToTopButton
        onPress={() => listRef.current?.scrollToOffset({ animated: true, offset: 0 })}
        visible={showScrollToTop}
      />
      <TradeCreateButton
        disabled={authStatus === 'loading'}
        onPress={openTradeCreate}
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
  searchRow: { marginTop: 24, flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.background, color: colors.text, fontSize: 14 },
  searchButton: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.primary },
  searchPressed: { backgroundColor: colors.primaryPressed },
  searchButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  sectionTitle: { marginTop: 26, color: colors.text, fontSize: 18, fontWeight: '800' },
  row: { gap: 12, marginBottom: 12 },
  stateBox: { paddingVertical: 64, alignItems: 'center', gap: 16 },
  stateText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  retryButton: { minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  emptyText: { paddingVertical: 64, color: colors.textMuted, textAlign: 'center' },
  moreButton: { minWidth: 160, minHeight: 48, marginTop: 24, marginBottom: 20, paddingHorizontal: 22, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.background },
  moreButtonPressed: { backgroundColor: colors.surface },
  moreButtonDisabled: { opacity: 0.6 },
  moreButtonText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  loadMoreError: { marginVertical: 20, alignItems: 'center', gap: 10 },
  loadMoreRetry: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12 },
  loadMoreRetryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
