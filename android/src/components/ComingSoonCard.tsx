import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type ComingSoonCardProps = {
  description: string;
  title: string;
};

export function ComingSoonCard({ description, title }: ComingSoonCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Android</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    marginTop: 18,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  description: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
