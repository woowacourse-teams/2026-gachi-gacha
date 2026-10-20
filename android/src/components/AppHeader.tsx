import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="가치가챠"
        source={require('../../assets/gacha-logo.png')}
        style={styles.logo}
      />
      <Text style={styles.brand}>가치가챠</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  logo: {
    width: 30,
    height: 30,
  },
  brand: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    marginLeft: 'auto',
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
