import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { TradeCard } from '../domains/trade/TradeCard';
import { useTrades } from '../domains/trade/useTrades';
import { colors } from '../theme/colors';
import type { TradeStackParamList } from '../navigation/TradeStack';

type Props = NativeStackScreenProps<TradeStackParamList, 'TradeList'>;

export function TradeScreen({ navigation }: Props) {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const trades = useTrades(keyword);

  return (
    <View style={styles.screen}>
      <AppHeader title="거래/교환" />
      <FlatList
        data={trades.items}
        keyExtractor={({ tradeId }) => String(tradeId)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <TradeCard trade={item} onPress={() => navigation.navigate('TradeDetail', { tradeId: item.tradeId })} />}
        onEndReached={() => void trades.loadMore()}
        onEndReachedThreshold={0.35}
        refreshControl={<RefreshControl refreshing={trades.isRefreshing} onRefresh={() => void trades.refresh()} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>어떤 거래글을 찾아볼까요?</Text>
            <View style={styles.searchRow}>
              <TextInput
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
            <Text style={styles.sectionTitle}>{keyword ? `‘${keyword}’ 검색결과` : '최신순'}</Text>
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
        ListFooterComponent={trades.isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null}
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
  searchRow: { marginTop: 18, flexDirection: 'row', gap: 8 },
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
  footerLoader: { marginVertical: 20 },
});
