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
import {
  ACCOUNT_DELETION_URL,
  SUPPORT_INSTAGRAM_URL,
} from '../config/web';
import { areTradeFeaturesEnabled } from '../config/features';
import { ProfileEditModal } from '../domains/auth/ProfileEditModal';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { TradeCard } from '../domains/trade/TradeCard';
import { useMyPageTrades } from '../domains/trade/useMyPageTrades';
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
  const tradeFeaturesEnabled = areTradeFeaturesEnabled();
  const myTrades = useMyPageTrades(
    status === 'authenticated' && tradeFeaturesEnabled,
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  async function openExternalPage(url: string, pageName: string) {
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

  function openTrade(tradeId: number) {
    navigation.navigate('Main', {
      screen: 'Trade',
      params: { screen: 'TradeDetail', params: { tradeId } },
    });
  }

  const accountName = member?.nickname ?? member?.name ?? '가치가챠 사용자';

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.heading}>마이페이지</Text>
          <Text style={styles.description}>
            내 교환 활동과 계정 정보를 한곳에서 관리해요.
          </Text>
        </View>

        {profileNotice && status === 'authenticated' && (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>{profileNotice}</Text>
        )}

        {status === 'loading' && (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>로그인 상태를 확인하고 있어요.</Text>
          </View>
        )}

        {status === 'guest' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>로그인이 필요해요</Text>
            <Text style={styles.stateText}>
              지도와 가챠 검색은 로그인 없이 이용할 수 있어요.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.loginButtonText}>소셜 로그인</Text>
            </Pressable>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>로그인 상태를 확인하지 못했어요</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={retry}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>다시 확인하기</Text>
            </Pressable>
          </View>
        )}

        {status === 'authenticated' && member && (
          <>
            <View style={styles.profileCard}>
              <RemoteImageWithFallback
                accessibilityLabel={`${accountName} 프로필 사진`}
                style={styles.avatar}
                uri={member.profileImageUrl}
              />
              <View style={styles.profileCopy}>
                <Text numberOfLines={1} style={styles.profileName}>{accountName}</Text>
                {member.name && <Text numberOfLines={1} style={styles.accountName}>{member.name}</Text>}
                <Text numberOfLines={2} style={styles.profileMeta}>
                  {member.desireTradeLocation || '선호 거래 지역을 아직 설정하지 않았어요.'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsProfileEditOpen(true)}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              >
                <Text style={styles.editButtonText}>수정</Text>
              </Pressable>
            </View>

            {tradeFeaturesEnabled && (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>올린 교환글</Text>
                    <Text style={styles.summaryValue}>
                      {myTrades.status === 'loading' ? '…' : myTrades.status === 'error' ? '—' : myTrades.totalTradeCount}
                    </Text>
                    <Text style={styles.summaryDescription}>내가 등록한 전체 글</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>진행 중 교환</Text>
                    <Text style={styles.summaryValue}>
                      {myTrades.status === 'loading' ? '…' : myTrades.status === 'error' ? '—' : myTrades.inProgressCount}
                    </Text>
                    <Text style={styles.summaryDescription}>현재 교환 중인 글</Text>
                  </View>
                </View>

                <View style={styles.tradeSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>내 교환글</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => navigation.navigate('MyTrades')}
                    >
                      <Text style={styles.sectionLink}>전체 보기</Text>
                    </Pressable>
                  </View>
                  {myTrades.status === 'loading' ? (
                    <View style={styles.tradeState}>
                      <ActivityIndicator color={colors.primary} />
                    </View>
                  ) : myTrades.status === 'error' ? (
                    <View style={styles.tradeState}>
                      <Text style={styles.stateTitle}>내 교환글을 불러오지 못했어요</Text>
                      <Text style={styles.stateText}>{myTrades.errorMessage}</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={myTrades.retry}
                        style={styles.retryButton}
                      >
                        <Text style={styles.retryText}>다시 시도</Text>
                      </Pressable>
                    </View>
                  ) : myTrades.recentTrades.length === 0 ? (
                    <View style={styles.tradeState}>
                      <Text style={styles.stateTitle}>아직 올린 교환글이 없어요</Text>
                      <Text style={styles.stateText}>
                        작성한 글이 생기면 여기서 바로 확인할 수 있어요.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      contentContainerStyle={styles.tradeList}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {myTrades.recentTrades.map((trade) => (
                        <View key={trade.tradeId} style={styles.tradeCardFrame}>
                          <TradeCard
                            onPress={() => openTrade(trade.tradeId)}
                            trade={trade}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </>
            )}
          </>
        )}

        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <View style={styles.menuSection}>
            {status === 'authenticated' && (
              <>
                <MenuRow
                  description="교환 상대와 나눈 대화를 확인해요."
                  label="채팅"
                  onPress={() => navigation.navigate('ChatRooms')}
                />
                <MenuRow
                  description="내 교환글에 달린 새 댓글을 확인해요."
                  label="알림"
                  onPress={() => navigation.navigate('Notifications')}
                />
                <MenuRow
                  description="차단 목록을 확인하고 해제할 수 있어요."
                  label="차단한 사용자"
                  onPress={() => navigation.navigate('BlockedMembers')}
                />
              </>
            )}
            <MenuRow
              description="개인정보 처리와 보관 기준을 확인해요."
              label="개인정보처리방침"
              onPress={() => navigation.navigate('PublicWebFeature', { feature: 'privacyPolicy' })}
            />
            <MenuRow
              description="인스타그램 DM으로 문의해 주세요."
              label="고객센터"
              onPress={() => void openExternalPage(SUPPORT_INSTAGRAM_URL, '고객센터')}
            />
            <MenuRow
              description="웹에서 본인 확인 후 계정 삭제를 요청해요."
              label="회원 탈퇴"
              onPress={() => void openExternalPage(ACCOUNT_DELETION_URL, '회원 탈퇴 페이지')}
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
        </View>
      </ScrollView>

      {member && (
        <ProfileEditModal
          member={member}
          onClose={() => setIsProfileEditOpen(false)}
          onSaved={() => setProfileNotice('프로필 정보를 저장했어요.')}
          visible={isProfileEditOpen}
        />
      )}
    </>
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
  description: { marginTop: 8, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  notice: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
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
  stateTitle: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: {
    minHeight: 42,
    marginTop: 6,
    paddingHorizontal: 17,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.background, fontWeight: '700' },
  loginButton: {
    minWidth: 132,
    minHeight: 44,
    marginTop: 4,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  loginButtonText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72 },
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
  avatar: { width: 68, height: 68, borderRadius: 34 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  accountName: { marginTop: 3, color: colors.textMuted, fontSize: 12 },
  profileMeta: { marginTop: 7, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  editButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 19,
  },
  editButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  summaryRow: { marginTop: 14, flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    minHeight: 132,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  summaryValue: { marginTop: 13, color: colors.primary, fontSize: 28, fontWeight: '800' },
  summaryDescription: { marginTop: 7, color: colors.textMuted, fontSize: 11 },
  tradeSection: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionLink: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  tradeState: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 9 },
  tradeList: { paddingTop: 16, paddingBottom: 3, gap: 12 },
  tradeCardFrame: { width: 230 },
  accountSection: { marginTop: 24 },
  menuSection: {
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  menuRow: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuRowPressed: { backgroundColor: colors.primarySoft },
  menuCopy: { flex: 1, minWidth: 0 },
  menuLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  menuDescription: { marginTop: 5, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  dangerText: { color: colors.primary },
  chevron: { marginLeft: 12, color: colors.textMuted, fontSize: 28 },
});
