import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { GachaSearchItem } from './gachaTypes';

export function GachaSearchCard({ gacha }: { gacha: GachaSearchItem }) {
  const storeLabel = gacha.storeCount > 0 ? `${gacha.storeCount}개 매장 보유중` : '보유 매장 없음';

  return (
    <View style={styles.card}>
      {gacha.thumbnailUrl ? (
        <Image source={{ uri: gacha.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder]}>
          <Text style={styles.placeholderText}>이미지 없음</Text>
        </View>
      )}
      <Text numberOfLines={2} style={styles.name}>{gacha.name}</Text>
      <Text numberOfLines={2} style={styles.categories}>
        {gacha.categories.slice(0, 3).join(' · ') || '카테고리 미설정'}
      </Text>
      <Text style={[styles.storeCount, gacha.storeCount === 0 && styles.noStore]}>{storeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 300,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#f1f1f3',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    minHeight: 42,
    marginTop: 11,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  categories: {
    minHeight: 34,
    marginTop: 7,
    color: '#4e5058',
    fontSize: 12,
    lineHeight: 17,
  },
  storeCount: {
    marginTop: 'auto',
    paddingTop: 10,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  noStore: {
    color: colors.textMuted,
  },
});
