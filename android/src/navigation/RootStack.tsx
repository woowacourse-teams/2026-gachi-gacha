import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { getPublicWebFeature, type PublicWebFeature } from '../config/web';
import { AccountScreen } from '../screens/AccountScreen';
import { BlockedMembersScreen } from '../screens/BlockedMembersScreen';
import { PublicWebFeatureScreen } from '../screens/PublicWebFeatureScreen';
import { colors } from '../theme/colors';
import { AppTabs, type AppTabParamList } from './AppTabs';

export type RootStackParamList = {
  Main: NavigatorScreenParams<AppTabParamList> | undefined;
  Account: undefined;
  BlockedMembers: undefined;
  PublicWebFeature: { feature: PublicWebFeature };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        component={AppTabs}
        name="Main"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={AccountScreen}
        name="Account"
        options={{
          title: '내 정보',
          headerShadowVisible: false,
          headerTintColor: colors.text,
        }}
      />
      <Stack.Screen
        component={BlockedMembersScreen}
        name="BlockedMembers"
        options={{
          title: '차단한 사용자',
          headerShadowVisible: false,
          headerTintColor: colors.text,
        }}
      />
      <Stack.Screen
        component={PublicWebFeatureScreen}
        name="PublicWebFeature"
        options={({ route }) => ({
          title: getPublicWebFeature(route.params.feature).title,
          headerShadowVisible: false,
          headerTintColor: colors.text,
        })}
      />
    </Stack.Navigator>
  );
}
