import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ImageViewerModal } from '../components/ImageViewerModal';
import { RemoteImageWithFallback } from '../components/RemoteImageWithFallback';
import { ShareIcon } from '../components/ShareIcon';
import { TradeCommentsSection } from '../domains/trade/TradeCommentsSection';
import { getTradeDetail } from '../domains/trade/tradeApi';
import type { TradeDetail, TradePlace } from '../domains/trade/tradeTypes';
import type { TradeStackParamList } from '../navigation/TradeStack';
import { openDirections, sharePublicPage } from '../shared/nativeActions';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<TradeStackParamList, 'TradeDetail'>;
type State = { status: 'loading' | 'error' | 'success'; data: TradeDetail | null; message: string | null };

const statusLabel = { AVAILABLE: '교환 가능', IN_PROGRESS: '교환 진행 중', COMPLETED: '교환 완료' } as const;

export function TradeDetailScreen({ route }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [state, setState] = useState<State>({ status: 'loading', data: null, message: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null, message: null });
    getTradeDetail(route.params.tradeId, controller.signal)
      .then((data) => setState({ status: 'success', data, message: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, message: error instanceof Error ? error.message : '교환글을 불러오지 못했습니다.' });
      });
    return () => controller.abort();
  }, [attempt, route.params.tradeId]);

  if (state.status === 'loading') return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (state.status === 'error' || !state.data) return <View style={styles.center}><Text style={styles.muted}>{state.message}</Text><Pressable style={styles.retry} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>;

  const trade = state.data;
  const rows = [
    ['얻고 싶은 것', trade.desiredProduction || '협의'],
    ['가능 시간', trade.availableTime || '협의'],
  ];
  const locations: Array<{ emptyValue: string; label: string; place: TradePlace | null }> = [
    { emptyValue: '미입력', label: '구매 매장', place: trade.purchaseStore },
    { emptyValue: '협의', label: '거래 장소', place: trade.tradePlace },
  ];

  async function handleShare() {
    try {
      await sharePublicPage({
        title: trade.title,
        message: `${trade.title}\n가치가챠에서 교환글을 확인해 보세요.`,
        path: `/trade/${trade.tradeId}`,
      });
    } catch {
      Alert.alert('공유할 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  async function handlePlaceDirections(label: string, place: TradePlace) {
    try {
      await openDirections({
        label: place.name || label,
        latitude: place.latitude,
        longitude: place.longitude,
      });
    } catch {
      Alert.alert('지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={styles.content}>
      {trade.imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {trade.imageUrls.map((url, index) => (
            <Pressable
              accessibilityLabel={`${trade.title} 사진 ${index + 1}`}
              accessibilityRole="button"
              key={`${url}-${index}`}
              onPress={() => setSelectedImageIndex(index)}
              style={styles.imageFrame}
            >
              <RemoteImageWithFallback
                accessibilityLabel={`${trade.title} 사진 ${index + 1}`}
                style={styles.image}
                uri={url}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <RemoteImageWithFallback
          accessibilityLabel="가치가챠 기본 이미지"
          style={styles.imageFrame}
          uri={null}
        />
      )}
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.itemRole}>가지고 있는 것</Text>
          <Text style={styles.title}>{trade.title}</Text>
        </View>
        <View style={styles.titleActions}>
          <View style={styles.badge}><Text style={styles.badgeText}>{statusLabel[trade.status]}</Text></View>
          <Pressable
            accessibilityLabel={`${trade.title} 공유하기`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void handleShare()}
            style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          >
            <ShareIcon />
          </Pressable>
        </View>
      </View>
      <Text style={styles.categories}>{trade.categories.join(' · ') || '카테고리 미설정'}</Text>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>가지고 있는 상품 설명</Text>
      <Text style={styles.description}>{trade.description || '작성된 설명이 없어요.'}</Text>
      <View style={styles.infoBox}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
        {locations.map(({ emptyValue, label, place }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{place?.name || place?.address || emptyValue}</Text>
            {place && (
              <Pressable
                accessibilityLabel={`${place.name || label} 지도에서 보기`}
                accessibilityRole="button"
                onPress={() => void handlePlaceDirections(label, place)}
                style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
              >
                <Text style={styles.mapButtonText}>지도에서 보기</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
      <TradeCommentsSection tradeId={trade.tradeId} />
      <ImageViewerModal
        imageUrls={trade.imageUrls}
        initialIndex={selectedImageIndex ?? 0}
        onClose={() => setSelectedImageIndex(null)}
        title={trade.title}
        visible={selectedImageIndex !== null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.surface },
  muted: { color: colors.textMuted, textAlign: 'center' },
  retry: { paddingHorizontal: 20, minHeight: 44, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  imageFrame: { width: 340, maxWidth: '100%', aspectRatio: 1, marginRight: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: '#f0f0f2' },
  image: { width: '100%', height: '100%' },
  titleRow: { marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1, minWidth: 0 },
  itemRole: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  title: { marginTop: 6, color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  titleActions: { alignItems: 'flex-end', gap: 9 },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: colors.primarySoft },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  categories: { marginTop: 12, color: '#4e5058', fontWeight: '700' },
  shareButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 21, backgroundColor: colors.background },
  shareButtonPressed: { backgroundColor: colors.primarySoft },
  divider: { height: 1, marginVertical: 22, backgroundColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  description: { marginTop: 12, color: colors.text, fontSize: 15, lineHeight: 24 },
  infoBox: { marginTop: 24, padding: 16, gap: 16, borderRadius: 18, backgroundColor: colors.background },
  infoRow: { gap: 6 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
  mapButton: { minHeight: 40, marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 15, justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12, backgroundColor: colors.background },
  mapButtonPressed: { backgroundColor: colors.primarySoft },
  mapButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
