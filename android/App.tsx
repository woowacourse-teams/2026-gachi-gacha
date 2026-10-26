import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider } from './src/domains/auth/AuthSessionContext';
import { AppTabs, type AppTabParamList } from './src/navigation/AppTabs';
import { navigationTheme } from './src/theme/navigationTheme';

const navigationRef = createNavigationContainerRef<AppTabParamList>();
const EXIT_CONFIRMATION_WINDOW_MS = 2_000;

export default function App() {
  const lastRootBackPressAt = useRef(0);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) {
          return false;
        }

        const now = Date.now();
        if (now - lastRootBackPressAt.current <= EXIT_CONFIRMATION_WINDOW_MS) {
          BackHandler.exitApp();
          return true;
        }

        lastRootBackPressAt.current = now;
        ToastAndroid.show('한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
        return true;
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <NavigationContainer ref={navigationRef} theme={navigationTheme}>
          <StatusBar style="dark" />
          <AppTabs />
        </NavigationContainer>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
