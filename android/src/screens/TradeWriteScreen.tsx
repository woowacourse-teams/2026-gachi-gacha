import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RemoteImageWithFallback } from '../components/RemoteImageWithFallback';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import {
  createTrade,
  getTradeCategories,
  getTradeDetail,
  updateTrade,
} from '../domains/trade/tradeApi';
import {
  clearCompressedTradeImages,
  compressTradeImages,
  MAX_TRADE_IMAGE_COUNT,
  validateTradeImageAsset,
} from '../domains/trade/tradeImage';
import { TradePlacePickerModal } from '../domains/trade/TradePlacePickerModal';
import type {
  TradeCategory,
  TradeDetail,
  TradePlaceInput,
  TradeImageUpload,
  TradeWriteRequest,
} from '../domains/trade/tradeTypes';
import type { TradeStackParamList } from '../navigation/TradeStack';
import { colors } from '../theme/colors';

type CreateProps = NativeStackScreenProps<TradeStackParamList, 'TradeCreate'>;
type EditProps = NativeStackScreenProps<TradeStackParamList, 'TradeEdit'>;

type InitialValues = {
  availableTime: string | null;
  categories: TradeCategory[];
  description: string;
  desiredProduction: string;
  imageUrls: string[];
  purchaseStore: TradePlaceInput | null;
  title: string;
  tradePlace: TradePlaceInput | null;
};

type FormProps = {
  initialValues?: InitialValues;
  mode: 'create' | 'edit';
  onSaved: (trade: TradeDetail) => void;
  tradeId?: number;
};

type PlaceTarget = 'purchaseStore' | 'tradePlace';

const EMPTY_VALUES: InitialValues = {
  availableTime: null,
  categories: [],
  description: '',
  desiredProduction: '',
  imageUrls: [],
  purchaseStore: null,
  title: '',
  tradePlace: null,
};

function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

function toPlaceInput(place: TradeDetail['tradePlace']): TradePlaceInput | null {
  if (!place) return null;
  return {
    ...(place.name ? { name: place.name } : {}),
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function TradeWriteForm({
  initialValues = EMPTY_VALUES,
  mode,
  onSaved,
  tradeId,
}: FormProps) {
  const { status: authStatus } = useAuthSession();
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [desiredProduction, setDesiredProduction] = useState(initialValues.desiredProduction);
  const [selectedCategories, setSelectedCategories] = useState(initialValues.categories);
  const [categoryKeyword, setCategoryKeyword] = useState('');
  const [categoryResults, setCategoryResults] = useState<TradeCategory[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [purchaseStore, setPurchaseStore] = useState<TradePlaceInput | null>(initialValues.purchaseStore);
  const [tradePlace, setTradePlace] = useState<TradePlaceInput | null>(initialValues.tradePlace);
  const [placeTarget, setPlaceTarget] = useState<PlaceTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      getTradeCategories(categoryKeyword, controller.signal)
        .then((items) => setCategoryResults(items))
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setCategoryError(error instanceof Error ? error.message : '카테고리를 불러오지 못했습니다.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingCategories(false);
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [categoryKeyword]);

  const availableCategories = useMemo(
    () => categoryResults.filter(
      ({ categoryId }) => !selectedCategories.some((selected) => selected.categoryId === categoryId),
    ),
    [categoryResults, selectedCategories],
  );

  async function selectImages() {
    const remaining = MAX_TRADE_IMAGE_COUNT - images.length;
    if (remaining <= 0) {
      Alert.alert('사진을 더 추가할 수 없어요', `사진은 최대 ${MAX_TRADE_IMAGE_COUNT}장까지 올릴 수 있어요.`);
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 1,
        selectionLimit: remaining,
      });
      if (result.canceled) return;
      result.assets.forEach(validateTradeImageAsset);
      setImages((current) => [...current, ...result.assets].slice(0, MAX_TRADE_IMAGE_COUNT));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '사진을 선택하지 못했습니다.');
    }
  }

  function selectCategory(category: TradeCategory) {
    setSelectedCategories((current) => [...current, category]);
    setCategoryKeyword('');
  }

  function setPlace(value: TradePlaceInput) {
    if (placeTarget === 'purchaseStore') setPurchaseStore(value);
    if (placeTarget === 'tradePlace') setTradePlace(value);
  }

  async function submit() {
    if (isSubmitting) return;
    if (authStatus !== 'authenticated') {
      setErrorMessage('로그인이 필요한 기능입니다.');
      return;
    }
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    if (!normalizedTitle) {
      setErrorMessage('제목을 입력해 주세요.');
      return;
    }
    if (!normalizedDescription) {
      setErrorMessage('설명을 입력해 주세요.');
      return;
    }
    if (mode === 'create' && images.length === 0) {
      setErrorMessage('사진을 1장 이상 등록해 주세요.');
      return;
    }

    const request: TradeWriteRequest = {
      title: normalizedTitle,
      description: normalizedDescription,
      ...(desiredProduction.trim() ? { desiredProduction: desiredProduction.trim() } : {}),
      ...(selectedCategories.length > 0
        ? { categoryIds: selectedCategories.map(({ categoryId }) => categoryId) }
        : {}),
      ...(purchaseStore ? { purchaseStore } : {}),
      ...(tradePlace ? { tradePlace } : {}),
      ...(initialValues.availableTime ? { availableTime: initialValues.availableTime } : {}),
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    let compressedImages: TradeImageUpload[] = [];
    try {
      setProgressLabel(images.length > 0 ? `사진 최적화 0/${images.length}` : '게시글 저장 중');
      compressedImages = await compressTradeImages(images, (completed, total) => {
        setProgressLabel(`사진 최적화 ${completed}/${total}`);
      });
      setProgressLabel('게시글 저장 중');
      const saved = mode === 'edit' && tradeId
        ? await updateTrade(tradeId, request, compressedImages)
        : await createTrade(request, compressedImages);
      onSaved(saved);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '교환 게시글을 저장하지 못했습니다.');
    } finally {
      clearCompressedTradeImages(compressedImages);
      setIsSubmitting(false);
      setProgressLabel(null);
    }
  }

  const currentPlace = placeTarget === 'purchaseStore' ? purchaseStore : tradePlace;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          {mode === 'create'
            ? '교환할 가챠의 사진과 정보를 입력하면 피드에 올라가요.'
            : '등록한 교환 정보를 확인하고 수정할 수 있어요.'}
        </Text>

        <Text style={styles.sectionTitle}>가지고 있는 것</Text>
        <Text style={styles.label}>사진 * ({images.length || initialValues.imageUrls.length}/{MAX_TRADE_IMAGE_COUNT})</Text>
        {mode === 'edit' && initialValues.imageUrls.length > 0 && images.length === 0 && (
          <>
            <Text style={styles.help}>새 사진을 추가하면 기존 사진은 모두 교체돼요.</Text>
            <ScrollView contentContainerStyle={styles.imageList} horizontal showsHorizontalScrollIndicator={false}>
              {initialValues.imageUrls.map((uri, index) => (
                <RemoteImageWithFallback
                  accessibilityLabel={`기존 거래 사진 ${index + 1}`}
                  key={`${uri}-${index}`}
                  style={styles.imagePreview}
                  uri={uri}
                />
              ))}
            </ScrollView>
          </>
        )}
        {images.length > 0 && (
          <ScrollView contentContainerStyle={styles.imageList} horizontal showsHorizontalScrollIndicator={false}>
            {images.map((image, index) => (
              <View key={`${image.assetId ?? image.uri}-${index}`} style={styles.imageItem}>
                <RemoteImageWithFallback accessibilityLabel={`선택한 거래 사진 ${index + 1}`} style={styles.imagePreview} uri={image.uri} />
                <View style={styles.imageActions}>
                  <Pressable accessibilityLabel={`사진 ${index + 1} 왼쪽으로 이동`} disabled={index === 0} onPress={() => setImages((current) => moveItem(current, index, index - 1))} style={styles.imageActionButton}><Text style={styles.imageActionText}>←</Text></Pressable>
                  <Pressable accessibilityLabel={`사진 ${index + 1} 삭제`} onPress={() => setImages((current) => current.filter((_, target) => target !== index))} style={styles.removeImageButton}><Text style={styles.removeImageText}>×</Text></Pressable>
                  <Pressable accessibilityLabel={`사진 ${index + 1} 오른쪽으로 이동`} disabled={index === images.length - 1} onPress={() => setImages((current) => moveItem(current, index, index + 1))} style={styles.imageActionButton}><Text style={styles.imageActionText}>→</Text></Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => void selectImages()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>사진 선택</Text>
        </Pressable>
        <Text style={styles.help}>JPG, PNG, WebP · 장당 10MB 이하 · 선택 순서가 표시 순서예요.</Text>

        <Text style={styles.label}>제목 *</Text>
        <TextInput maxLength={255} onChangeText={setTitle} placeholder="가지고 있는 가챠를 알아보기 쉽게 적어주세요" placeholderTextColor={colors.textMuted} style={styles.input} value={title} />
        <Text style={styles.label}>설명 *</Text>
        <TextInput maxLength={5000} multiline onChangeText={setDescription} placeholder="상품 상태와 거래 방법을 자세히 적어주세요" placeholderTextColor={colors.textMuted} style={[styles.input, styles.textArea]} textAlignVertical="top" value={description} />

        <Text style={styles.label}>카테고리 (선택)</Text>
        {selectedCategories.length > 0 && (
          <View style={styles.chipList}>
            {selectedCategories.map((category) => (
              <Pressable key={category.categoryId} onPress={() => setSelectedCategories((current) => current.filter(({ categoryId }) => categoryId !== category.categoryId))} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{category.name} ×</Text>
              </Pressable>
            ))}
          </View>
        )}
        <TextInput onChangeText={setCategoryKeyword} placeholder="카테고리를 검색해주세요" placeholderTextColor={colors.textMuted} style={styles.input} value={categoryKeyword} />
        {isLoadingCategories ? (
          <ActivityIndicator color={colors.primary} style={styles.categoryState} />
        ) : categoryError ? (
          <Text style={styles.fieldError}>{categoryError}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.categoryResults} horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
            {availableCategories.slice(0, 12).map((category) => (
              <Pressable key={category.categoryId} onPress={() => selectCategory(category)} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>+ {category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>얻고 싶은 것</Text>
        <Text style={styles.label}>얻고 싶은 상품 (선택)</Text>
        <TextInput maxLength={255} onChangeText={setDesiredProduction} placeholder="비워두면 제안을 받을 수 있어요" placeholderTextColor={colors.textMuted} style={styles.input} value={desiredProduction} />

        <Text style={styles.sectionTitle}>장소</Text>
        <PlaceField label="구매 매장" onClear={() => setPurchaseStore(null)} onOpen={() => setPlaceTarget('purchaseStore')} value={purchaseStore} />
        <PlaceField label="거래 장소" onClear={() => setTradePlace(null)} onOpen={() => setPlaceTarget('tradePlace')} value={tradePlace} />

        {errorMessage && <Text accessibilityLiveRegion="polite" style={styles.submitError}>{errorMessage}</Text>}
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => void submit()} style={({ pressed }) => [styles.submitButton, (pressed || isSubmitting) && styles.pressed]}>
          {isSubmitting && <ActivityIndicator color={colors.background} size="small" />}
          <Text style={styles.submitText}>{progressLabel ?? (mode === 'create' ? '교환글 등록하기' : '수정 내용 저장하기')}</Text>
        </Pressable>
      </ScrollView>

      <TradePlacePickerModal
        initialValue={currentPlace}
        onClose={() => setPlaceTarget(null)}
        onSelect={setPlace}
        title={placeTarget === 'purchaseStore' ? '구매 매장 선택' : '거래 장소 선택'}
        visible={placeTarget !== null}
      />
    </KeyboardAvoidingView>
  );
}

function PlaceField({ label, onClear, onOpen, value }: { label: string; onClear: () => void; onOpen: () => void; value: TradePlaceInput | null }) {
  return (
    <View style={styles.placeField}>
      <Text style={styles.label}>{label} (선택)</Text>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.placeButton}>
        <View style={styles.placeCopy}>
          <Text style={[styles.placeName, !value && styles.placeholder]}>{value?.name || value?.address || `${label}을 선택해 주세요`}</Text>
          {value?.name && <Text style={styles.placeAddress}>{value.address}</Text>}
        </View>
        <Text aria-hidden style={styles.chevron}>›</Text>
      </Pressable>
      {value && <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearPlaceButton}><Text style={styles.clearPlaceText}>선택 해제</Text></Pressable>}
    </View>
  );
}

export function TradeCreateScreen({ navigation }: CreateProps) {
  const { status } = useAuthSession();

  if (status === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.help}>로그인 상태를 확인하고 있어요.</Text></View>;
  }
  if (status !== 'authenticated') {
    return <View style={styles.center}><Text style={styles.stateTitle}>로그인이 필요해요</Text><Text style={styles.help}>안전한 앱 로그인 인계가 연결되면 교환글을 작성할 수 있어요.</Text></View>;
  }

  return (
    <TradeWriteForm
      mode="create"
      onSaved={(trade) => navigation.replace('TradeDetail', { tradeId: trade.tradeId })}
    />
  );
}

export function TradeEditScreen({ navigation, route }: EditProps) {
  const { memberId, status: authStatus } = useAuthSession();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; detail: TradeDetail; categories: TradeCategory[] }
  >({ status: 'loading' });

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    const controller = new AbortController();
    setState({ status: 'loading' });
    Promise.all([
      getTradeDetail(route.params.tradeId, controller.signal),
      getTradeCategories('', controller.signal),
    ])
      .then(([detail, categories]) => {
        if (controller.signal.aborted) return;
        const selected = detail.categories.flatMap((name) => {
          const category = categories.find((candidate) => candidate.name === name);
          return category ? [category] : [];
        });
        if (selected.length !== detail.categories.length) {
          throw new Error('게시글의 기존 카테고리 정보를 확인하지 못했습니다.');
        }
        setState({ status: 'success', detail, categories: selected });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', message: error instanceof Error ? error.message : '수정할 교환글을 불러오지 못했습니다.' });
      });
    return () => controller.abort();
  }, [attempt, authStatus, route.params.tradeId]);

  if (authStatus === 'loading') return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.help}>로그인 상태를 확인하고 있어요.</Text></View>;
  if (authStatus !== 'authenticated') return <View style={styles.center}><Text style={styles.stateTitle}>로그인이 필요해요</Text><Text style={styles.help}>로그인한 작성자만 교환글을 수정할 수 있어요.</Text></View>;
  if (state.status === 'loading') return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.help}>수정할 교환글을 불러오고 있어요.</Text></View>;
  if (state.status === 'error') return <View style={styles.center}><Text style={styles.submitError}>{state.message}</Text><Pressable onPress={() => setAttempt((value) => value + 1)} style={styles.submitButton}><Text style={styles.submitText}>다시 시도</Text></Pressable></View>;
  if (memberId === null || memberId !== state.detail.memberId) return <View style={styles.center}><Text style={styles.submitError}>작성자만 교환글을 수정할 수 있어요.</Text></View>;

  const detail = state.detail;
  const initialValues: InitialValues = {
    availableTime: detail.availableTime,
    categories: state.categories,
    description: detail.description ?? '',
    desiredProduction: detail.desiredProduction ?? '',
    imageUrls: detail.imageUrls,
    purchaseStore: toPlaceInput(detail.purchaseStore),
    title: detail.title,
    tradePlace: toPlaceInput(detail.tradePlace),
  };

  return (
    <TradeWriteForm
      initialValues={initialValues}
      mode="edit"
      onSaved={() => navigation.pop()}
      tradeId={detail.tradeId}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 18, paddingBottom: 52 },
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  sectionTitle: { marginTop: 28, marginBottom: 4, color: colors.text, fontSize: 20, fontWeight: '800' },
  label: { marginTop: 16, marginBottom: 8, color: colors.text, fontSize: 13, fontWeight: '800' },
  help: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  input: { minHeight: 50, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, backgroundColor: colors.background, fontSize: 14 },
  textArea: { minHeight: 132 },
  imageList: { paddingVertical: 12, gap: 10 },
  imageItem: { width: 150 },
  imagePreview: { width: 150, height: 150, borderRadius: 15 },
  imageActions: { marginTop: 7, flexDirection: 'row', justifyContent: 'space-between' },
  imageActionButton: { width: 38, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background },
  imageActionText: { color: colors.text, fontSize: 17, fontWeight: '800' },
  removeImageButton: { width: 38, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primarySoft },
  removeImageText: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  secondaryButton: { minHeight: 46, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 14, backgroundColor: colors.background },
  secondaryButtonText: { color: colors.primary, fontWeight: '800' },
  chipList: { marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 18, backgroundColor: colors.primary },
  selectedChipText: { color: colors.background, fontSize: 12, fontWeight: '800' },
  categoryResults: { paddingVertical: 10, gap: 8 },
  categoryChip: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background },
  categoryChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  categoryState: { marginVertical: 14 },
  fieldError: { marginTop: 8, color: colors.primary, fontSize: 12 },
  placeField: { marginTop: 2 },
  placeButton: { minHeight: 68, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.background },
  placeCopy: { flex: 1, minWidth: 0 },
  placeName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  placeholder: { color: colors.textMuted, fontWeight: '500' },
  placeAddress: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  chevron: { color: colors.textMuted, fontSize: 24 },
  clearPlaceButton: { minHeight: 36, alignSelf: 'flex-end', paddingHorizontal: 8, justifyContent: 'center' },
  clearPlaceText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  submitError: { marginTop: 20, color: colors.primary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  submitButton: { minHeight: 54, marginTop: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: colors.primary },
  submitText: { color: colors.background, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.surface },
  stateTitle: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
});
