import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIVACY_POLICY_URL } from '../config/web';
import { colors } from '../theme/colors';

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  async function openPrivacyPolicy() {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert(
        '페이지를 열 수 없어요',
        '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  function showServiceInformation() {
    Alert.alert(
      '서비스 정보',
      '가치가챠의 개인정보 처리 기준을 운영 웹페이지에서 확인할 수 있어요.',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '개인정보처리방침',
          onPress: () => void openPrivacyPolicy(),
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="가치가챠"
        resizeMode="contain"
        source={require('../../assets/gachigacha-wordmark.png')}
        style={styles.logo}
      />
      <View style={styles.actionGroup}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityLabel="서비스 정보 열기"
          accessibilityRole="button"
          hitSlop={6}
          onPress={showServiceInformation}
          style={({ pressed }) => [
            styles.infoButton,
            pressed && styles.infoButtonPressed,
          ]}
        >
          <Text aria-hidden style={styles.infoIcon}>i</Text>
        </Pressable>
      </View>
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
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  actionGroup: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  infoButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    borderRadius: 9,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
  },
});
