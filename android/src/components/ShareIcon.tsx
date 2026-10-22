import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

export function ShareIcon() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
      <View style={[styles.connector, styles.connectorTop]} />
      <View style={[styles.connector, styles.connectorBottom]} />
      <View style={[styles.node, styles.nodeLeft]} />
      <View style={[styles.node, styles.nodeTop]} />
      <View style={[styles.node, styles.nodeBottom]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { position: 'relative', width: 22, height: 22 },
  connector: {
    position: 'absolute',
    left: 6,
    width: 11,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  connectorTop: { top: 8, transform: [{ rotate: '-27deg' }] },
  connectorBottom: { top: 14, transform: [{ rotate: '27deg' }] },
  node: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  nodeLeft: { top: 8, left: 0 },
  nodeTop: { top: 1, right: 0 },
  nodeBottom: { right: 0, bottom: 1 },
});
