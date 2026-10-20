import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';

import { MapScreen } from '../screens/MapScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { colors } from '../theme/colors';

export type AppTabParamList = {
  Trade: undefined;
  Map: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

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

export function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Trade"
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: tabLabels[route.name],
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} label={tabLabels[route.name]} />
        ),
      })}
    >
      <Tab.Screen name="Trade" component={TradeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.surface,
  },
  tabBar: {
    minHeight: 64,
    paddingTop: 7,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
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
