import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RemoteImageWithFallback } from '../components/RemoteImageWithFallback';
import { ACCOUNT_DELETION_URL } from '../config/web';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

type MenuRowProps = {
  description: string;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
};

function MenuRow({ description, label, onPress, tone = 'default' }: MenuRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <View style={styles.menuCopy}>
        <Text style={[styles.menuLabel, tone === 'danger' && styles.dangerText]}>
          {label}
        </Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Text accessibilityElementsHidden style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function AccountScreen({ navigation }: Props) {
  const { errorMessage, logout, member, retry, status } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function openWebPage(url: string, pageName: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(`${pageName}을 열 수 없어요`, '잠시 후 다시 시도해 주세요.');
    }
  }

  function confirmLogout() {
    Alert.alert('로그아웃할까요?', '이 기기에 저장된 로그인 정보가 삭제돼요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          setIsLoggingOut(true);
          void logout().finally(() => setIsLoggingOut(false));
        },
      },
    ]);
  }

  const accountName = member?.nickname ?? member?.name ?? '가치가챠 사용자';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.heading}>내 정보</Text>
        <Text style={styles.description}>
          계정과 개인정보 처리 경로를 한곳에서 확인할 수 있어요.
        </Text>
      </View>

      {status === 'loading' && (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>로그인 상태를 확인하고 있어요.</Text>
        </View>
      )}

      {status === 'guest' && (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>로그인하지 않은 상태예요</Text>
          <Text style={styles.stateText}>
            지도와 가챠 검색은 로그인 없이 이용할 수 있어요. 소셜 로그인은 안전한
            네이티브 인증 인계가 준비되면 이 화면에 연결됩니다.
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>로그인 상태를 확인하지 못했어요</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.retryText}>다시 확인하기</Text>
          </Pressable>
        </View>
      )}

      {status === 'authenticated' && member && (
        <View style={styles.profileCard}>
          <RemoteImageWithFallback
            accessibilityLabel={`${accountName} 프로필 사진`}
            style={styles.avatar}
            uri={member.profileImageUrl}
          />
          <View style={styles.profileCopy}>
            <Text numberOfLines={1} style={styles.profileName}>{accountName}</Text>
            <Text numberOfLines={2} style={styles.profileMeta}>
              {member.desireTradeLocation || '희망 거래 장소를 아직 설정하지 않았어요.'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        {status === 'authenticated' && (
          <MenuRow
            description="차단한 사용자를 확인하고 차단을 해제해요."
            label="차단한 사용자"
            onPress={() => navigation.navigate('BlockedMembers')}
          />
        )}
        <MenuRow
          description="수집하는 정보와 이용 기준을 확인해요."
          label="개인정보처리방침"
          onPress={() =>
            navigation.navigate('PublicWebFeature', { feature: 'privacyPolicy' })
          }
        />
        <MenuRow
          description="앱에 접근하기 어려워도 웹에서 계정 삭제를 요청할 수 있어요."
          label="회원 탈퇴 안내"
          onPress={() => void openWebPage(ACCOUNT_DELETION_URL, '회원 탈퇴 페이지')}
          tone="danger"
        />
        {status === 'authenticated' && (
          <MenuRow
            description="이 기기에 저장된 로그인 정보를 삭제해요."
            label={isLoggingOut ? '로그아웃 중…' : '로그아웃'}
            onPress={isLoggingOut ? () => undefined : confirmLogout}
          />
        )}
      </View>

      <Text style={styles.finePrint}>
        소셜 로그인 버튼과 앱 내부 탈퇴 처리는 서버의 일회성 인증 인계 계약이
        확정된 뒤 연결됩니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    backgroundColor: colors.surface,
  },
  intro: { marginBottom: 20 },
  heading: { color: colors.text, fontSize: 28, fontWeight: '800' },
  description: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  stateCard: {
    minHeight: 150,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  stateText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    marginTop: 6,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.background, fontWeight: '700' },
  buttonPressed: { opacity: 0.75 },
  profileCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  profileMeta: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  menuSection: {
    marginTop: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  menuRow: {
    minHeight: 78,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuRowPressed: { backgroundColor: colors.primarySoft },
  menuCopy: { flex: 1, minWidth: 0 },
  menuLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  menuDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  dangerText: { color: colors.primary },
  chevron: { marginLeft: 12, color: colors.textMuted, fontSize: 28 },
  finePrint: {
    marginTop: 18,
    paddingHorizontal: 4,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
