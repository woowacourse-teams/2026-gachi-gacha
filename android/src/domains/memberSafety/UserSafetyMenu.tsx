import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, type AlertButton } from 'react-native';

import { colors } from '../../theme/colors';
import { useMemberSafety } from './MemberSafetyContext';
import type { MemberSafetySource } from './memberSafetyApi';

interface UserSafetyMenuProps {
  targetMemberId: number | null;
  targetNickname: string;
  source: MemberSafetySource;
  referenceId?: string | null;
  onBlocked?: () => void;
}

export function UserSafetyMenu({
  targetMemberId,
  targetNickname,
  source,
  referenceId = null,
  onBlocked,
}: UserSafetyMenuProps) {
  const { blockMember, openMemberReport } = useMemberSafety();
  const [isBlocking, setIsBlocking] = useState(false);

  function openMenu() {
    const buttons: AlertButton[] = [
      { text: '취소', style: 'cancel' },
      {
        text: '신고하기',
        onPress: () =>
          openMemberReport({
            memberId: targetMemberId,
            nickname: targetNickname,
            source,
            referenceId,
          }),
      },
    ];

    if (targetMemberId !== null) {
      buttons.push({
        text: '차단하기',
        style: 'destructive' as const,
        onPress: confirmBlock,
      });
    }

    Alert.alert(`${targetNickname} 사용자 메뉴`, undefined, buttons);
  }

  function confirmBlock() {
    if (targetMemberId === null || isBlocking) return;

    Alert.alert(
      `${targetNickname}님을 차단할까요?`,
      '이 사용자의 교환글, 댓글과 채팅이 보이지 않아요. 차단 목록에서 언제든 해제할 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단하기',
          style: 'destructive',
          onPress: () => {
            setIsBlocking(true);
            void blockMember(targetMemberId, source, targetNickname, referenceId)
              .then(() => onBlocked?.())
              .catch((error: unknown) => {
                Alert.alert(
                  '차단하지 못했어요',
                  error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
                );
              })
              .finally(() => setIsBlocking(false));
          },
        },
      ],
    );
  }

  return (
    <Pressable
      accessibilityLabel={`${targetNickname} 사용자 메뉴`}
      accessibilityRole="button"
      disabled={isBlocking}
      hitSlop={8}
      onPress={openMenu}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>•••</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pressed: { backgroundColor: colors.surface },
  label: { color: colors.textMuted, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
