import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImageWithFallback } from '../../components/RemoteImageWithFallback';
import { colors } from '../../theme/colors';
import type { NearbyStore } from './storeTypes';

export function NearbyStoreCard({
  selected = false,
  store,
  onPress,
}: {
  selected?: boolean;
  store: NearbyStore;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${store.name} 매장 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <RemoteImageWithFallback
        accessibilityLabel={`${store.name} 매장 이미지`}
        style={styles.thumbnail}
        uri={store.thumbnailUrl}
      />
      <View style={styles.information}>
        <Text numberOfLines={1} style={styles.name}>{store.name}</Text>
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
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#fffafa',
  },
  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: '#f1f1f3',
  },
  information: { flex: 1, paddingVertical: 4 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  address: { marginTop: 9, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  gachaCount: { marginTop: 'auto', color: colors.primary, fontSize: 12, fontWeight: '700' },
});
