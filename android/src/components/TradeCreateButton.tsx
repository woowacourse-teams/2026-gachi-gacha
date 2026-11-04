import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme/colors';

type Props = {
  disabled?: boolean;
  onPress: () => void;
};

export function TradeCreateButton({ disabled = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityLabel="교환 글 등록"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Svg accessibilityElementsHidden height={28} viewBox="0 0 24 24" width={28}>
        <Path
          d="M12 5v14M5 12h14"
          stroke={colors.background}
          strokeLinecap="round"
          strokeWidth={2.4}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    zIndex: 20,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.primary,
    elevation: 7,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ translateY: 1 }],
  },
  disabled: { opacity: 0.48 },
});
