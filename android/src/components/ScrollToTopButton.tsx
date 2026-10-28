import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

type Props = {
  onPress: () => void;
  visible: boolean;
};

export function ScrollToTopButton({ onPress, visible }: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Pressable
      accessibilityLabel="목록 맨 위로 이동"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { top: insets.top + 74 },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.arrow}>↑</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.background,
    elevation: 6,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  pressed: { backgroundColor: colors.primarySoft },
  arrow: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 29,
  },
});
