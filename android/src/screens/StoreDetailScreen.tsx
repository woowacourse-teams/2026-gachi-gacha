import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ImageViewerModal } from '../components/ImageViewerModal';
import { StoreGachaCard } from '../domains/store/StoreGachaCard';
import type { StoreDetail } from '../domains/store/storeTypes';
import { useStoreDetail, useStoreGachas } from '../domains/store/useStoreDetail';
import type { MapStackParamList } from '../navigation/MapStack';
import { openDirections, openPhoneNumber, sharePublicPage } from '../shared/nativeActions';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<MapStackParamList, 'StoreDetail'>;

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatRange(minimum: number | null, maximum: number | null): string | null {
  const validMinimum = minimum !== null && minimum > 0 ? minimum : null;
  const validMaximum = maximum !== null && maximum > 0 ? maximum : null;

  if (validMinimum === null) {
    return validMaximum === null ? null : `${formatWon(validMaximum)}까지`;
  }
  if (validMaximum === null) return `${formatWon(validMinimum)}부터`;
  if (validMinimum === validMaximum) return formatWon(validMinimum);
  return `${formatWon(validMinimum)} ~ ${formatWon(validMaximum)}`;
}

function createInformationRows(store: StoreDetail): Array<[string, string]> {
  const amenities = [
    ...store.facilities,
    ...(store.hasRandomBox ? ['랜덤박스'] : []),
    ...(store.hasSelectGacha ? ['선택 가챠'] : []),
  ].map((item) => item.trim()).filter(Boolean);
  const rows: Array<[string, string | null]> = [
    ['영업시간', store.businessHours],
    ['전화번호', store.phoneNumber],
    ['인스타그램', store.instagramId],
    ['결제수단', store.paymentMethods],
    ['편의시설', amenities.length > 0 ? [...new Set(amenities)].join(' · ') : null],
    ['가챠 기기', store.gachaMachineAmount !== null && store.gachaMachineAmount > 0 ? `${store.gachaMachineAmount}대` : null],
    ['쿠지', store.kujiAmount !== null && store.kujiAmount > 0 ? `${store.kujiAmount}개 운영` : null],
    ['코인 1개', store.coinPrice !== null && store.coinPrice > 0 ? formatWon(store.coinPrice) : null],
    ['가챠 가격', formatRange(store.gachaPriceMin, store.gachaPriceMax)],
    ['쿠지 가격', formatRange(store.kujiPriceMin, store.kujiPriceMax)],
    ['셀렉트 가챠 가격', formatRange(store.selectGachaPriceMin, store.selectGachaPriceMax)],
  ];

  return rows.filter((row): row is [string, string] => row[1] !== null && row[1].trim().length > 0);
}

export function StoreDetailScreen({ navigation, route }: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const detail = useStoreDetail(route.params.storeId);
  const gachas = useStoreGachas(route.params.storeId);
  const { width } = useWindowDimensions();
  const imageWidth = Math.min(width - 36, 440);

  if (detail.status === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (detail.status === 'error' || !detail.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateText}>{detail.errorMessage}</Text>
        <Pressable onPress={detail.retry} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  const store = detail.data;
  const imageUrls = [...new Set([
    store.thumbnailUrl,
    ...store.images.map(({ imageUrl }) => imageUrl),
  ].filter((url): url is string => Boolean(url?.trim())))];
  const rows = createInformationRows(store);

  async function handleDirections() {
    try {
      await openDirections({
        label: store.name,
        latitude: route.params.latitude,
        longitude: route.params.longitude,
      });
    } catch {
      Alert.alert('길찾기를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  async function handlePhone() {
    if (!store.phoneNumber) return;

    try {
      await openPhoneNumber(store.phoneNumber);
    } catch {
      Alert.alert('전화를 연결할 수 없어요', '기기의 전화 기능과 전화번호를 확인해 주세요.');
    }
  }

  async function handleShare() {
    try {
      await sharePublicPage({
        title: store.name,
        message: `${store.name}\n${store.address}`,
        path: `/stores/${store.storeId}`,
      });
    } catch {
      Alert.alert('공유할 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{store.name}</Text>
      <Text style={styles.address}>{store.address}</Text>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel={`${store.name} 길찾기`}
          accessibilityRole="button"
          onPress={() => void handleDirections()}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
        >
          <Text style={styles.primaryActionText}>길찾기</Text>
        </Pressable>
        {store.phoneNumber && (
          <Pressable
            accessibilityLabel={`${store.name} 전화 걸기`}
            accessibilityRole="button"
            onPress={() => void handlePhone()}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
          >
            <Text style={styles.secondaryActionText}>전화</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel={`${store.name} 공유하기`}
          accessibilityRole="button"
          onPress={() => void handleShare()}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
        >
          <Text style={styles.secondaryActionText}>공유</Text>
        </Pressable>
      </View>

      {imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {imageUrls.map((url, index) => (
            <Pressable
              accessibilityLabel={`${store.name} 매장 사진 ${index + 1}`}
              accessibilityRole="button"
              key={url}
              onPress={() => setSelectedImageIndex(index)}
              style={[styles.storeImageFrame, { width: imageWidth }]}
            >
              <Image source={{ uri: url }} style={styles.storeImage} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View
          style={[styles.storeImageFrame, styles.imagePlaceholder, { width: imageWidth }]}
        >
          <Text style={styles.placeholderText}>매장 사진을 준비하고 있어요</Text>
        </View>
      )}

      {rows.length > 0 && (
        <View style={styles.infoBox}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.catalogHeader}>
        <Text style={styles.sectionTitle}>보유 중인 가챠</Text>
        {gachas.page && <Text style={styles.totalCount}>{gachas.page.totalElements}개</Text>}
      </View>

      {gachas.status === 'loading' && <ActivityIndicator color={colors.primary} style={styles.catalogState} />}
      {gachas.status === 'error' && (
        <View style={styles.catalogState}>
          <Text style={styles.stateText}>{gachas.errorMessage}</Text>
          <Pressable onPress={gachas.retry} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      )}
      {gachas.status === 'success' && gachas.items.length === 0 && (
        <Text style={styles.emptyText}>등록된 보유 가챠가 없어요.</Text>
      )}
      {gachas.items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gachaList}>
          {gachas.items.map((gacha) => (
            <StoreGachaCard
              gacha={gacha}
              key={gacha.gachaId}
              onPress={() => navigation.navigate('MapHome', {
                gachaId: gacha.gachaId,
                gachaName: gacha.gachaName,
              })}
            />
          ))}
        </ScrollView>
      )}
      {gachas.loadMoreErrorMessage && (
        <View style={styles.loadMoreState}>
          <Text style={styles.stateText}>{gachas.loadMoreErrorMessage}</Text>
          <Pressable onPress={() => void gachas.retryLoadMore()} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>다시 불러오기</Text>
          </Pressable>
        </View>
      )}
      {gachas.page && gachas.page.pageNumber + 1 < gachas.page.totalPages && !gachas.loadMoreErrorMessage && (
        <Pressable
          disabled={gachas.isLoadingMore}
          onPress={() => void gachas.loadMore()}
          style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
        >
          {gachas.isLoadingMore
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={styles.outlineButtonText}>가챠 더 보기</Text>}
        </Pressable>
      )}
      <ImageViewerModal
        imageUrls={imageUrls}
        initialIndex={selectedImageIndex ?? 0}
        onClose={() => setSelectedImageIndex(null)}
        title={store.name}
        visible={selectedImageIndex !== null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 18, paddingBottom: 42 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: 27, fontWeight: '800', lineHeight: 36 },
  address: { marginTop: 8, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  actionRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryAction: { minHeight: 44, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  primaryActionPressed: { backgroundColor: colors.primaryPressed },
  primaryActionText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  secondaryAction: { minHeight: 44, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.background },
  secondaryActionPressed: { backgroundColor: colors.primarySoft },
  secondaryActionText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  gallery: { marginTop: 20 },
  storeImageFrame: { aspectRatio: 4 / 3, marginRight: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: '#eeeeef' },
  storeImage: { width: '100%', height: '100%' },
  imagePlaceholder: { marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  infoBox: { marginTop: 22, padding: 17, gap: 16, borderRadius: 18, backgroundColor: colors.background },
  infoRow: { gap: 5 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 14, lineHeight: 21 },
  catalogHeader: { marginTop: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  totalCount: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  catalogState: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 14 },
  stateText: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  emptyText: { paddingVertical: 48, color: colors.textMuted, textAlign: 'center' },
  gachaList: { paddingTop: 16, paddingBottom: 4, gap: 12 },
  loadMoreState: { marginTop: 18, alignItems: 'center', gap: 10 },
  outlineButton: { minHeight: 46, marginTop: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 14, backgroundColor: colors.background },
  outlineButtonPressed: { backgroundColor: colors.primarySoft },
  outlineButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
