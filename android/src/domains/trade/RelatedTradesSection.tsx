import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMemberSafety } from '../memberSafety/MemberSafetyContext';
import { colors } from '../../theme/colors';
import { TradeCard } from './TradeCard';
import { useRelatedTrades } from './useRelatedTrades';

type Props = {
  onSelectTrade: (tradeId: number) => void;
  tradeId: number;
};

export function RelatedTradesSection({ onSelectTrade, tradeId }: Props) {
  const { isMemberBlocked } = useMemberSafety();
  const { hasMore, isLoading, items, loadMore } = useRelatedTrades(tradeId);
  const visibleItems = items.filter(({ memberId }) => !isMemberBlocked(memberId));

  if (visibleItems.length === 0 && !isLoading) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>다른 교환 물품</Text>
      {visibleItems.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {visibleItems.map((trade) => (
            <View key={trade.tradeId} style={styles.cardFrame}>
              <TradeCard
                onPress={() => onSelectTrade(trade.tradeId)}
                trade={trade}
              />
            </View>
          ))}
          {hasMore && (
            <Pressable
              accessibilityLabel="다른 교환 물품 더보기"
              accessibilityRole="button"
              disabled={isLoading}
              onPress={loadMore}
              style={({ pressed }) => [
                styles.moreCard,
                (pressed || isLoading) && styles.moreButtonPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.moreArrow}>→</Text>
              )}
              <Text style={styles.moreButtonText}>
                {isLoading ? '불러오는 중...' : '더보기'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: 'stretch',
    gap: 12,
  },
  cardFrame: {
    width: 230,
  },
  loadingArea: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCard: {
    width: 112,
    minHeight: 340,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  moreButtonPressed: { opacity: 0.65 },
  moreArrow: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  moreButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
