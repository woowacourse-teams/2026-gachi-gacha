import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getTradeDetail } from '../domains/trade/tradeApi';
import type { TradeDetail } from '../domains/trade/tradeTypes';
import type { TradeStackParamList } from '../navigation/TradeStack';
import { sharePublicPage } from '../shared/nativeActions';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<TradeStackParamList, 'TradeDetail'>;
type State = { status: 'loading' | 'error' | 'success'; data: TradeDetail | null; message: string | null };

const statusLabel = { AVAILABLE: '교환 가능', IN_PROGRESS: '교환 진행 중', COMPLETED: '교환 완료' } as const;

export function TradeDetailScreen({ route }: Props) {
  const [attempt, setAttempt] = useState(0);
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
    ['거래 희망 상품', trade.desiredProduction || '협의'],
    ['구매 매장', trade.purchaseStore?.name || trade.purchaseStore?.address || '미입력'],
    ['거래 장소', trade.tradePlace?.name || trade.tradePlace?.address || '협의'],
    ['가능 시간', trade.availableTime || '협의'],
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {trade.imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {trade.imageUrls.map((url) => <Image key={url} source={{ uri: url }} style={styles.image} />)}
        </ScrollView>
      ) : <View style={[styles.image, styles.imagePlaceholder]}><Text style={styles.placeholderText}>G</Text></View>}
      <View style={styles.titleRow}><Text style={styles.title}>{trade.title}</Text><View style={styles.badge}><Text style={styles.badgeText}>{statusLabel[trade.status]}</Text></View></View>
      <Text style={styles.categories}>{trade.categories.join(' · ') || '카테고리 미설정'}</Text>
      <Pressable
        accessibilityLabel={`${trade.title} 공유하기`}
        accessibilityRole="button"
        onPress={() => void handleShare()}
        style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
      >
        <Text style={styles.shareButtonText}>교환글 공유</Text>
      </Pressable>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>상세 설명</Text>
      <Text style={styles.description}>{trade.description || '작성된 설명이 없어요.'}</Text>
      <View style={styles.infoBox}>{rows.map(([label, value]) => <View key={label} style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>)}</View>
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
  image: { width: 340, maxWidth: '100%', aspectRatio: 1, borderRadius: 20, backgroundColor: '#f0f0f2', marginRight: 12 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.primary, fontSize: 52, fontWeight: '900' },
  titleRow: { marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: colors.primarySoft },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  categories: { marginTop: 12, color: '#4e5058', fontWeight: '700' },
  shareButton: { minHeight: 44, marginTop: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 14, backgroundColor: colors.background },
  shareButtonPressed: { backgroundColor: colors.primarySoft },
  shareButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  divider: { height: 1, marginVertical: 22, backgroundColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  description: { marginTop: 12, color: colors.text, fontSize: 15, lineHeight: 24 },
  infoBox: { marginTop: 24, padding: 16, gap: 16, borderRadius: 18, backgroundColor: colors.background },
  infoRow: { gap: 6 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
