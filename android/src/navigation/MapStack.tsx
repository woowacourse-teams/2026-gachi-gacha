import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapScreen } from '../screens/MapScreen';
import { StoreDetailScreen } from '../screens/StoreDetailScreen';
import { colors } from '../theme/colors';

export type MapStackParamList = {
  MapHome: { gachaId?: number; gachaName?: string } | undefined;
  StoreDetail: {
    storeId: number;
    storeName?: string;
    latitude: number;
    longitude: number;
  };
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MapHome" component={MapScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="StoreDetail"
        component={StoreDetailScreen}
        options={({ route }) => ({
          title: route.params.storeName || '매장 상세',
          headerTintColor: colors.text,
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
