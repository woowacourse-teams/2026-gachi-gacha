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
        resizeMode="contain"
        source={require('../../assets/gachigacha-wordmark.png')}
        style={styles.logo}
      />
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
    width: 128,
    height: 19,
  },
  title: {
    marginLeft: 'auto',
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
