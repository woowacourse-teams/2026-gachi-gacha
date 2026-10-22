import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImageWithFallback } from '../../components/RemoteImageWithFallback';
import { colors } from '../../theme/colors';
import type { NearbyStore } from './storeTypes';

function formatDistance(distance: number): string {
  if (distance < 1000) return `${Math.round(distance)}m`;
  return `${(distance / 1000).toFixed(1)}km`;
}

export function NearbyStoreCard({ store, onPress }: { store: NearbyStore; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${store.name} 매장 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <RemoteImageWithFallback
        accessibilityLabel={`${store.name} 매장 이미지`}
        style={styles.thumbnail}
        uri={store.thumbnailUrl}
      />
      <View style={styles.information}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>{store.name}</Text>
          <Text style={styles.distance}>{formatDistance(store.distance)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.address}>{store.address}</Text>
        {store.gachaCount !== undefined && (
          <Text style={styles.gachaCount}>보유 가챠 {store.gachaCount}개</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 112,
    padding: 10,
    flexDirection: 'row',
    gap: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  cardPressed: { opacity: 0.78 },
  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: '#f1f1f3',
  },
  information: { flex: 1, paddingVertical: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
  distance: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  address: { marginTop: 9, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  gachaCount: { marginTop: 'auto', color: colors.primary, fontSize: 12, fontWeight: '700' },
});
