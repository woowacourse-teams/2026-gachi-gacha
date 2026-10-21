import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { TradeStatus, TradeSummary } from './tradeTypes';

const statusPresentation: Record<TradeStatus, { label: string; color: string; background: string }> = {
  AVAILABLE: { label: '교환 가능', color: colors.primary, background: colors.primarySoft },
  IN_PROGRESS: { label: '교환 진행 중', color: '#8a651c', background: '#fff8df' },
  COMPLETED: { label: '교환 완료', color: colors.textMuted, background: '#f0f0f2' },
};

function formatRelativeTime(value: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function TradeCard({ trade, onPress }: { trade: TradeSummary; onPress: () => void }) {
  const status = statusPresentation[trade.status];
  const place = trade.tradePlace?.name || trade.tradePlace?.address || '교환 장소 협의';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {trade.thumbnailUrl ? (
        <Image source={{ uri: trade.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder]}>
          <Text style={styles.placeholderText}>G</Text>
        </View>
      )}
      <View style={styles.content}>
        <View>
          <Text numberOfLines={2} style={styles.title}>{trade.title}</Text>
          <Text numberOfLines={2} style={styles.categories}>
            {trade.categories.join(' · ') || '카테고리 미설정'}
          </Text>
        </View>
        <View style={styles.tradeInfo}>
          <Text numberOfLines={1} style={styles.meta}>{place}</Text>
          <Text style={styles.meta}>{formatRelativeTime(trade.createdAt)}</Text>
          <View style={[styles.badge, { backgroundColor: status.background }]}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 340, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background },
  cardPressed: { opacity: 0.82 },
  thumbnail: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#f1f1f3' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.primary, fontSize: 34, fontWeight: '900' },
  content: { flex: 1, paddingHorizontal: 4, paddingTop: 10, justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  categories: { marginTop: 8, color: '#4e5058', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  tradeInfo: { marginTop: 12, gap: 8 },
  meta: { color: colors.textMuted, fontSize: 12 },
  badge: { minHeight: 26, paddingHorizontal: 9, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
