import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isWebShellEnabled } from './src/config/webShell';
import { AuthSessionProvider } from './src/domains/auth/AuthSessionContext';
import { MobileOAuthInitialCallbackHandler } from './src/domains/auth/MobileOAuthInitialCallbackHandler';
import { ChatUnreadProvider } from './src/domains/chat/ChatUnreadContext';
import { MemberSafetyProvider } from './src/domains/memberSafety/MemberSafetyContext';
import { NotificationProvider } from './src/domains/notification/NotificationContext';
import { usePushNotifications } from './src/domains/notification/usePushNotifications';
import { RootStack, type RootStackParamList } from './src/navigation/RootStack';
import { WebAppShellScreen } from './src/screens/WebAppShellScreen';
import { navigationTheme } from './src/theme/navigationTheme';

const navigationRef = createNavigationContainerRef<RootStackParamList>();
const EXIT_CONFIRMATION_WINDOW_MS = 2_000;
let pendingNativePushPath: string | null = null;

function openNativePushPath(path: string): void {
  if (!navigationRef.isReady()) {
    pendingNativePushPath = path;
    return;
  }

  const tradeMatch = /^\/trade\/(\d+)$/.exec(path);
  if (tradeMatch) {
    navigationRef.navigate('Main', {
      screen: 'Trade',
      params: {
        screen: 'TradeDetail',
        params: { tradeId: Number(tradeMatch[1]) },
      },
    });
    return;
  }

  const chatMatch = /^\/chat\/(\d+)$/.exec(path);
  if (chatMatch) {
    navigationRef.navigate('ChatRoom', { roomId: Number(chatMatch[1]) });
  }
}

function NativePushNotificationBridge() {
  usePushNotifications(openNativePushPath);
  return null;
}

function NativeApp() {
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
    <AuthSessionProvider>
      <MobileOAuthInitialCallbackHandler />
      <NativePushNotificationBridge />
      <ChatUnreadProvider>
        <NotificationProvider>
          <MemberSafetyProvider>
            <NavigationContainer
              ref={navigationRef}
              theme={navigationTheme}
              onReady={() => {
                if (!pendingNativePushPath) return;
                const path = pendingNativePushPath;
                pendingNativePushPath = null;
                openNativePushPath(path);
              }}
            >
              <StatusBar style="dark" />
              <RootStack />
            </NavigationContainer>
          </MemberSafetyProvider>
        </NotificationProvider>
      </ChatUnreadProvider>
    </AuthSessionProvider>
  );
}

function WebShellApp() {
  return (
    <AuthSessionProvider>
      <MobileOAuthInitialCallbackHandler />
      <WebAppShellScreen />
    </AuthSessionProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {isWebShellEnabled() ? <WebShellApp /> : <NativeApp />}
    </SafeAreaProvider>
  );
}
