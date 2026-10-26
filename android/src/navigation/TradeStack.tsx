import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TradeDetailScreen } from '../screens/TradeDetailScreen';
import { BlockedMembersScreen } from '../screens/BlockedMembersScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { colors } from '../theme/colors';

export type TradeStackParamList = {
  TradeList: undefined;
  TradeDetail: { tradeId: number };
  BlockedMembers: undefined;
};

const Stack = createNativeStackNavigator<TradeStackParamList>();

export function TradeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TradeList" component={TradeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="TradeDetail"
        component={TradeDetailScreen}
        options={{ title: '교환글 상세', headerTintColor: colors.text, headerShadowVisible: false }}
      />
      <Stack.Screen
        name="BlockedMembers"
        component={BlockedMembersScreen}
        options={{ title: '차단한 사용자', headerTintColor: colors.text, headerShadowVisible: false }}
      />
    </Stack.Navigator>
  );
}
