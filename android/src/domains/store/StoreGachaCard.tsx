import { Pressable, StyleSheet, Text } from 'react-native';

import { RemoteImageWithFallback } from '../../components/RemoteImageWithFallback';
import { colors } from '../../theme/colors';
import type { StoreGacha } from './storeTypes';

export function StoreGachaCard({
  gacha,
  onPress,
}: {
  gacha: StoreGacha;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${gacha.gachaName} 보유 매장 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <RemoteImageWithFallback
        accessibilityLabel={`${gacha.gachaName} 이미지`}
        style={styles.thumbnail}
        uri={gacha.thumbnailUrl}
      />
      <Text numberOfLines={2} style={styles.name}>{gacha.gachaName}</Text>
      <Text style={styles.link}>보유 매장 보기 →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 156,
    minHeight: 235,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.78 },
  thumbnail: { width: '100%', aspectRatio: 1, borderRadius: 13, backgroundColor: '#f1f1f3' },
  name: { marginTop: 10, color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  link: { marginTop: 'auto', paddingTop: 8, color: colors.primary, fontSize: 11, fontWeight: '700' },
});
