import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TradeDetailScreen } from '../screens/TradeDetailScreen';
import { TradeScreen } from '../screens/TradeScreen';
import { TradeCreateScreen, TradeEditScreen } from '../screens/TradeWriteScreen';
import { colors } from '../theme/colors';

export type TradeStackParamList = {
  TradeList: undefined;
  TradeDetail: { tradeId: number };
  TradeCreate: undefined;
  TradeEdit: { tradeId: number };
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
        name="TradeCreate"
        component={TradeCreateScreen}
        options={{ title: '교환글 작성', headerTintColor: colors.text, headerShadowVisible: false }}
      />
      <Stack.Screen
        name="TradeEdit"
        component={TradeEditScreen}
        options={{ title: '교환글 수정', headerTintColor: colors.text, headerShadowVisible: false }}
      />
    </Stack.Navigator>
  );
}
