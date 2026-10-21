import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { GachaSearchCard } from '../domains/gacha/GachaSearchCard';
import { useGachaSearch } from '../domains/gacha/useGachaSearch';
import { colors } from '../theme/colors';

export function SearchScreen() {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const search = useGachaSearch(keyword);

  function submitSearch() {
    setKeyword(input.trim());
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="검색" />
      <FlatList
        data={search.items}
        keyExtractor={({ gachaId }) => String(gachaId)}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <GachaSearchCard gacha={item} />}
        onEndReached={() => void search.loadMore()}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>오늘은 어떤 가챠를 찾아볼까요?</Text>
            <View style={styles.searchRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={submitSearch}
                returnKeyType="search"
                autoCorrect={false}
                placeholder="캐릭터나 가챠 이름을 검색"
                placeholderTextColor="#a1a1a8"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!input.trim()}
                onPress={submitSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  !input.trim() && styles.searchButtonDisabled,
                  pressed && input.trim() && styles.searchButtonPressed,
                ]}
              >
                <Text style={styles.searchButtonText}>검색</Text>
              </Pressable>
            </View>
            {search.status === 'success' && (
              <Text style={styles.resultTitle}>‘{keyword}’ 검색 결과 {search.totalCount}개</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          search.status === 'idle' ? (
            <Text style={styles.emptyText}>찾고 싶은 캐릭터나 카테고리를 입력해 주세요.</Text>
          ) : search.status === 'loading' ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.stateText}>가챠를 찾고 있어요...</Text>
            </View>
          ) : search.status === 'error' ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>{search.errorMessage}</Text>
              <Pressable onPress={search.retry} style={styles.retryButton}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>검색어와 관련된 가챠가 없어요.</Text>
          )
        }
        ListFooterComponent={
          <View>
            {search.loadMoreErrorMessage && search.items.length > 0 && (
              <View style={styles.loadMoreError}>
                <Text style={styles.stateText}>{search.loadMoreErrorMessage}</Text>
                <Pressable onPress={() => void search.retryLoadMore()} style={styles.loadMoreRetry}>
                  <Text style={styles.loadMoreRetryText}>다시 불러오기</Text>
                </Pressable>
              </View>
            )}
            {search.isLoadingMore && <ActivityIndicator color={colors.primary} style={styles.footerLoader} />}
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
    paddingTop: 28,
    paddingBottom: 22,
  },
  heading: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  searchRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: 14,
  },
  searchButton: {
    minWidth: 64,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  searchButtonDisabled: { opacity: 0.45 },
  searchButtonPressed: { backgroundColor: colors.primaryPressed },
  searchButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  resultTitle: { marginTop: 26, color: colors.text, fontSize: 18, fontWeight: '800' },
  row: { gap: 12, marginBottom: 12 },
  stateBox: { paddingVertical: 72, alignItems: 'center', gap: 16 },
  stateText: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  emptyText: { paddingVertical: 72, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  footerLoader: { marginVertical: 20 },
  loadMoreError: { marginVertical: 20, alignItems: 'center', gap: 10 },
  loadMoreRetry: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.primary },
  loadMoreRetryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
