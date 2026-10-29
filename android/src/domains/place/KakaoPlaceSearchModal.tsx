import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { searchKakaoPlaces } from './kakaoPlaceSearchApi';
import type {
  KakaoPlaceSearchResult,
  PlaceSearchSelection,
} from './placeSearchTypes';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

type Props = {
  description?: string;
  onClose: () => void;
  onSelect: (place: PlaceSearchSelection) => void;
  title?: string;
  visible: boolean;
};

export function KakaoPlaceSearchModal({
  description = '지하철역이나 건물명을 검색해주세요.',
  onClose,
  onSelect,
  title = '교환 장소 선택',
  visible,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<KakaoPlaceSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      controllerRef.current?.abort();
      requestIdRef.current += 1;
      return;
    }

    setKeyword('');
    setResults([]);
    setStatus('idle');
    setErrorMessage(null);

    return () => {
      controllerRef.current?.abort();
      requestIdRef.current += 1;
    };
  }, [visible]);

  async function search() {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      setStatus('error');
      setErrorMessage('검색할 장소를 입력해주세요.');
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    controllerRef.current = controller;
    requestIdRef.current = requestId;
    setStatus('loading');
    setErrorMessage(null);

    try {
      const nextResults = await searchKakaoPlaces(
        normalizedKeyword,
        controller.signal,
      );

      if (requestIdRef.current !== requestId) return;
      setResults(nextResults);
      setStatus('success');
    } catch (error) {
      if (controller.signal.aborted || requestIdRef.current !== requestId) return;
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : '장소를 검색하지 못했습니다.',
      );
    }
  }

  function select(place: KakaoPlaceSearchResult) {
    onSelect({
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    onClose();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => inputRef.current?.focus()}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardArea}
        >
          <Pressable onPress={onClose} style={styles.backdrop}>
            <Pressable
              accessibilityViewIsModal
              onPress={(event) => event.stopPropagation()}
              style={styles.panel}
            >
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text accessibilityRole="header" style={styles.title}>{title}</Text>
                  <Text style={styles.description}>{description}</Text>
                </View>
                <Pressable
                  accessibilityLabel={`${title} 창 닫기`}
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                >
                  <Text aria-hidden style={styles.closeText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.searchRow}>
                <TextInput
                  accessibilityLabel="장소 검색어"
                  autoCapitalize="none"
                  enterKeyHint="search"
                  maxLength={100}
                  onChangeText={setKeyword}
                  onSubmitEditing={() => void search()}
                  placeholder="예: 홍대입구역"
                  placeholderTextColor={colors.textMuted}
                  ref={inputRef}
                  returnKeyType="search"
                  style={styles.input}
                  value={keyword}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={status === 'loading'}
                  onPress={() => void search()}
                  style={({ pressed }) => [
                    styles.searchButton,
                    status === 'loading' && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.searchButtonText}>검색</Text>
                </Pressable>
              </View>

              <View style={styles.resultArea}>
                {status === 'idle' ? (
                  <Text style={styles.resultMessage}>
                    장소를 검색하면 결과가 여기에 표시돼요.
                  </Text>
                ) : status === 'loading' ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator color={colors.primary} />
                    <Text accessibilityLiveRegion="polite" style={styles.resultMessageCompact}>
                      장소를 검색하는 중...
                    </Text>
                  </View>
                ) : status === 'error' ? (
                  <Text accessibilityLiveRegion="assertive" style={styles.resultMessage}>
                    {errorMessage}
                  </Text>
                ) : results.length === 0 ? (
                  <Text accessibilityLiveRegion="polite" style={styles.resultMessage}>
                    검색된 장소가 없어요.
                  </Text>
                ) : (
                  <FlatList
                    data={results}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={({ id }) => id}
                    renderItem={({ item }) => (
                      <Pressable
                        accessibilityLabel={`${item.name}, ${item.address}`}
                        accessibilityRole="button"
                        onPress={() => select(item)}
                        style={({ pressed }) => [
                          styles.resultButton,
                          pressed && styles.resultButtonPressed,
                        ]}
                      >
                        <Text style={styles.placeName}>{item.name}</Text>
                        <Text style={styles.placeAddress}>{item.address}</Text>
                      </Pressable>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'rgba(20, 20, 24, 0.48)' },
  keyboardArea: { flex: 1 },
  backdrop: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  panel: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    padding: 24,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: colors.background,
    elevation: 12,
    shadowColor: '#18191e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#242429', fontSize: 24, fontWeight: '800' },
  description: { marginTop: 8, color: '#777981', fontSize: 14, lineHeight: 20 },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f3f3f5',
  },
  closeText: { color: '#555760', fontSize: 24, lineHeight: 27 },
  searchRow: { marginTop: 24, flexDirection: 'row', gap: 8 },
  input: {
    minWidth: 0,
    height: 48,
    flex: 1,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#dedee3',
    borderRadius: 10,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  searchButton: {
    minWidth: 76,
    height: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  searchButtonText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  resultArea: { minHeight: 180, maxHeight: 420, marginTop: 20 },
  resultMessage: {
    paddingHorizontal: 12,
    paddingVertical: 56,
    color: '#858790',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingState: { paddingVertical: 52, alignItems: 'center', gap: 10 },
  resultMessageCompact: { color: '#858790', fontSize: 14, textAlign: 'center' },
  resultButton: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    alignItems: 'flex-start',
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ededf0',
    backgroundColor: colors.background,
  },
  resultButtonPressed: { backgroundColor: '#fff5f7' },
  placeName: { color: '#292a30', fontSize: 15, fontWeight: '800' },
  placeAddress: { color: '#777981', fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
