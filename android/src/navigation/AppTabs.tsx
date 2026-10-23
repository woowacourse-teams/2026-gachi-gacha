import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { areTradeFeaturesEnabled } from '../config/features';
import { SearchScreen } from '../screens/SearchScreen';
import { colors } from '../theme/colors';
import { MapStack, type MapStackParamList } from './MapStack';
import { TradeStack } from './TradeStack';

export type AppTabParamList = {
  Trade: undefined;
  Map: NavigatorScreenParams<MapStackParamList> | undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_GAP = 10;

const tabLabels = {
  Trade: '거래/교환',
  Map: '지도',
  Search: '검색',
} as const;

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {label.slice(0, 1)}
    </Text>
  );
}

function TabBarButton({
  accessibilityLabel,
  accessibilityState,
  children,
  onLongPress,
  onPress,
  style,
  testID,
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        styles.tabButton,
        pressed && styles.tabButtonPressed,
      ]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export function AppTabs() {
  const insets = useSafeAreaInsets();
  const tradeFeaturesEnabled = areTradeFeaturesEnabled();

  return (
    <Tab.Navigator
      initialRouteName={tradeFeaturesEnabled ? 'Trade' : 'Map'}
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: [
          styles.scene,
          {
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + TAB_BAR_GAP * 2,
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.primarySoft,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: TabBarButton,
        tabBarItemStyle: styles.tabItem,
        tabBarLabel: tabLabels[route.name],
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: insets.bottom + TAB_BAR_GAP,
            height: TAB_BAR_HEIGHT,
          },
        ],
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} label={tabLabels[route.name]} />
        ),
      })}
    >
      {tradeFeaturesEnabled && (
        <Tab.Screen name="Trade" component={TradeStack} />
      )}
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.surface,
  },
  tabBar: {
    position: 'absolute',
    right: 12,
    left: 12,
    paddingTop: 5,
    paddingBottom: 5,
    overflow: 'hidden',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.background,
    elevation: 8,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  tabItem: {
    marginHorizontal: 4,
    overflow: 'hidden',
    borderRadius: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabButtonPressed: {
    opacity: 0.72,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 25,
    textAlign: 'center',
  },
  tabIconFocused: {
    color: colors.background,
    backgroundColor: colors.primary,
  },
});
