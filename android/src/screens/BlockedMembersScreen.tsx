import { Alert, ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { useMemberSafety } from '../domains/memberSafety/MemberSafetyContext';
import type { BlockedMember } from '../domains/memberSafety/memberSafetyApi';
import { useBottomContentPadding } from '../shared/useBottomContentPadding';
import { colors } from '../theme/colors';

function formatBlockedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '차단 날짜를 확인할 수 없어요';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 차단`;
}

export function BlockedMembersScreen() {
  const bottomContentPadding = useBottomContentPadding();
  const { status: authStatus } = useAuthSession();
  const {
    blockedMembers,
    loadErrorMessage,
    loadStatus,
    refreshBlockedMembers,
    unblockMember,
  } = useMemberSafety();

  function confirmUnblock(member: BlockedMember) {
    Alert.alert(
      `${member.nickname}님 차단을 해제할까요?`,
      '해제하면 이 사용자의 교환글과 댓글이 다시 표시돼요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단 해제',
          onPress: () => {
            void unblockMember(member.memberId).catch((error: unknown) => {
              Alert.alert(
                '차단을 해제하지 못했어요',
                error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
              );
            });
          },
        },
      ],
    );
  }

  if (authStatus !== 'authenticated') {
    return (
      <View style={styles.statePanel}>
        <Text style={styles.stateTitle}>로그인이 필요해요</Text>
        <Text style={styles.stateText}>로그인한 뒤 차단 목록을 확인할 수 있어요.</Text>
      </View>
    );
  }

  if (loadStatus === 'loading' || loadStatus === 'idle') {
    return (
      <View style={styles.statePanel}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.stateText}>차단 목록을 불러오고 있어요.</Text>
      </View>
    );
  }

  if (loadStatus === 'error') {
    return (
      <View style={styles.statePanel}>
        <Text style={styles.stateTitle}>차단 목록을 불러오지 못했어요</Text>
        <Text style={styles.stateText}>{loadErrorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void refreshBlockedMembers()} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomContentPadding },
      ]}
      data={blockedMembers}
      keyExtractor={({ memberId }) => String(memberId)}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.heading}>차단한 사용자</Text>
          <Text style={styles.description}>차단한 사용자의 교환글, 댓글과 채팅은 표시되지 않아요.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyPanel}>
          <Text style={styles.stateTitle}>차단한 사용자가 없어요</Text>
          <Text style={styles.stateText}>차단하면 이곳에서 언제든 해제할 수 있어요.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.memberRow}>
          <View accessibilityElementsHidden style={styles.avatar}>
            <Text style={styles.avatarText}>{item.nickname.trim().slice(0, 1) || '?'}</Text>
          </View>
          <View style={styles.memberCopy}>
            <Text numberOfLines={1} style={styles.memberName}>{item.nickname}</Text>
            <Text style={styles.blockedAt}>{formatBlockedAt(item.blockedAt)}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => confirmUnblock(item)} style={styles.unblockButton}>
            <Text style={styles.unblockText}>차단 해제</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, backgroundColor: colors.surface },
  header: { paddingTop: 8, paddingBottom: 22 },
  heading: { color: colors.text, fontSize: 26, fontWeight: '800' },
  description: { marginTop: 8, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  statePanel: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.surface },
  emptyPanel: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  stateText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryButton: { minHeight: 44, marginTop: 8, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontWeight: '700' },
  memberRow: { minHeight: 76, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.primarySoft },
  avatarText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  blockedAt: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  unblockButton: { minHeight: 40, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.background },
  unblockText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
