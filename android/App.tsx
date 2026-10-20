import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from './src/theme/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="가치가챠"
          source={require('./assets/gacha-logo.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>가치가챠</Text>
      <Text style={styles.description}>
        원하는 가챠를 찾고, 중복 굿즈를 가까운 사람과 교환해 보세요.
      </Text>
      <Text style={styles.preparing}>Android 앱을 준비하고 있어요</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    marginBottom: 24,
  },
  logo: {
    width: 76,
    height: 76,
  },
  title: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  description: {
    maxWidth: 320,
    marginTop: 16,
    color: colors.text,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  preparing: {
    marginTop: 28,
    color: colors.textMuted,
    fontSize: 14,
  },
});
