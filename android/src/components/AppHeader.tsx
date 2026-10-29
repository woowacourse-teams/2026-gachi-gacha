import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { useChatUnread } from '../domains/chat/ChatUnreadContext';
import { useNotifications } from '../domains/notification/NotificationContext';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';
import { RemoteImageWithFallback } from './RemoteImageWithFallback';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { member, status: authStatus } = useAuthSession();
  const {
    refreshUnreadCount: refreshUnreadChatCount,
    unreadCount: unreadChatCount,
  } = useChatUnread();
  const { refreshUnreadCount: refreshNotificationCount, unreadCount } = useNotifications();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const isAuthenticated = authStatus === 'authenticated';

  function openAccount() {
    if (isAuthenticated) {
      setIsAccountMenuOpen(true);
      void Promise.all([refreshUnreadChatCount(), refreshNotificationCount()]);
      return;
    }

    navigation.navigate('Login');
  }

  function openMyPage() {
    setIsAccountMenuOpen(false);
    navigation.navigate('Account');
  }

  function openNotifications() {
    setIsAccountMenuOpen(false);
    navigation.navigate('Notifications');
  }

  function openChat() {
    setIsAccountMenuOpen(false);
    navigation.navigate('ChatRooms');
  }

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <View accessibilityLabel="가치가챠" style={styles.brand}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={require('../../assets/gacha-logo.png')}
            style={styles.brandSymbol}
          />
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={require('../../assets/gachigacha-wordmark.png')}
            style={styles.wordmark}
          />
        </View>

        <Pressable
          accessibilityLabel={isAuthenticated ? '사용자 메뉴 열기' : '로그인'}
          accessibilityRole="button"
          hitSlop={6}
          onPress={openAccount}
          style={({ pressed }) => [
            isAuthenticated ? styles.profileButton : styles.loginButton,
            pressed && styles.buttonPressed,
          ]}
        >
          {isAuthenticated ? (
            <RemoteImageWithFallback
              accessibilityLabel={`${member?.nickname ?? '사용자'} 프로필`}
              style={styles.profileImage}
              uri={member?.profileImageUrl}
            />
          ) : (
            <Text style={styles.loginButtonText}>
              {authStatus === 'loading' ? '확인 중' : '로그인'}
            </Text>
          )}
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsAccountMenuOpen(false)}
        statusBarTranslucent
        transparent
        visible={isAccountMenuOpen}
      >
        <Pressable
          accessibilityLabel="사용자 메뉴 닫기"
          onPress={() => setIsAccountMenuOpen(false)}
          style={styles.menuBackdrop}
        >
          <View
            accessibilityRole="menu"
            onStartShouldSetResponder={() => true}
            style={[styles.accountMenu, { top: insets.top + 62 }]}
          >
            <Pressable
              accessibilityRole="menuitem"
              onPress={openChat}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={styles.menuItemText}>채팅</Text>
              {unreadChatCount > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </Text>
                </View>
              )}
              <Text aria-hidden style={styles.menuItemArrow}>›</Text>
            </Pressable>
            <Pressable
              accessibilityRole="menuitem"
              onPress={openNotifications}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={styles.menuItemText}>알림</Text>
              {unreadCount > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
              <Text aria-hidden style={styles.menuItemArrow}>›</Text>
            </Pressable>
            <Pressable
              accessibilityRole="menuitem"
              onPress={openMyPage}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={styles.menuItemText}>마이페이지</Text>
              <Text aria-hidden style={styles.menuItemArrow}>›</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  brand: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandSymbol: {
    width: 31,
    height: 31,
  },
  wordmark: {
    width: 112,
    height: 18,
  },
  loginButton: {
    minWidth: 62,
    height: 36,
    marginLeft: 'auto',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  loginButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  profileButton: {
    width: 38,
    height: 38,
    marginLeft: 'auto',
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.background,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  buttonPressed: { backgroundColor: colors.primarySoft },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36, 33, 34, 0.14)',
  },
  accountMenu: {
    position: 'absolute',
    right: 16,
    width: 170,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
    elevation: 10,
    shadowColor: '#242122',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  menuItem: {
    minHeight: 46,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
  },
  menuItemPressed: { backgroundColor: colors.primarySoft },
  menuBadge: {
    minWidth: 22,
    height: 20,
    marginRight: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  menuBadgeText: { color: colors.background, fontSize: 10, fontWeight: '800' },
  menuItemText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemArrow: {
    color: colors.textMuted,
    fontSize: 23,
    lineHeight: 24,
  },
});
