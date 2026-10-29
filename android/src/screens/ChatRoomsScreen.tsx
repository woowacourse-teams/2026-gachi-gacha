import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RemoteImageWithFallback } from '../components/RemoteImageWithFallback';
import { useAuthSession } from '../domains/auth/AuthSessionContext';
import { useChatUnread } from '../domains/chat/ChatUnreadContext';
import { getChatRooms } from '../domains/chat/chatApi';
import type { ChatRoomSummary, ChatRoomUpdate } from '../domains/chat/chatTypes';
import { useChatSocket } from '../domains/chat/useChatSocket';
import { useMemberSafety } from '../domains/memberSafety/MemberSafetyContext';
import type { RootStackParamList } from '../navigation/RootStack';
import { useBottomContentPadding } from '../shared/useBottomContentPadding';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRooms'>;

function formatRelativeTime(value: string): string {
  if (!value) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function ChatRoomsScreen({ navigation }: Props) {
  const bottomContentPadding = useBottomContentPadding();
  const isFocused = useIsFocused();
  const { memberId } = useAuthSession();
  const { isMemberBlocked } = useMemberSafety();
  const { setUnreadCount } = useChatUnread();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus((current) => rooms.length === 0 ? 'loading' : current);
    getChatRooms(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRooms(data);
          setStatus('success');
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : '채팅방을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRefreshing(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const receiveRoomUpdate = useCallback(({ room, totalUnreadCount }: ChatRoomUpdate) => {
    setUnreadCount(totalUnreadCount);
    setRooms((current) => [room, ...current.filter(({ roomId }) => roomId !== room.roomId)]);
  }, [setUnreadCount]);

  const socket = useChatSocket({
    active: isFocused,
    memberId,
    onMessage: () => undefined,
    onRoomUpdate: receiveRoomUpdate,
    roomId: null,
  });

  const visibleRooms = useMemo(
    () => rooms.filter(({ otherMember }) => !isMemberBlocked(otherMember.memberId)),
    [isMemberBlocked, rooms],
  );

  if (status === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.muted}>채팅방을 불러오고 있어요.</Text></View>;
  }

  if (status === 'error' && rooms.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>채팅방을 불러오지 못했어요</Text>
        <Text style={styles.muted}>{errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => setAttempt((current) => current + 1)} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {socket.errorMessage && <Text style={styles.socketError}>{socket.errorMessage}</Text>}
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomContentPadding },
        ]}
        data={visibleRooms}
        keyExtractor={({ roomId }) => String(roomId)}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.stateTitle}>아직 채팅방이 없어요</Text>
            <Text style={styles.muted}>교환글에서 채팅을 시작하면 이곳에 모아 보여드릴게요.</Text>
          </View>
        )}
        refreshControl={(
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => { setIsRefreshing(true); setAttempt((current) => current + 1); }}
            refreshing={isRefreshing}
          />
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ChatRoom', { roomId: item.roomId })}
            style={({ pressed }) => [styles.roomCard, pressed && styles.pressed]}
          >
            <RemoteImageWithFallback
              accessibilityLabel={`${item.otherMember.nickname} 프로필`}
              style={styles.avatar}
              uri={item.otherMember.profileImageUrl}
            />
            <View style={styles.roomCopy}>
              <View style={styles.roomTitleRow}>
                <Text numberOfLines={1} style={styles.partnerName}>{item.otherMember.nickname}</Text>
                <Text style={styles.time}>{formatRelativeTime(item.lastMessage?.sentAt ?? item.createdAt)}</Text>
              </View>
              <Text numberOfLines={1} style={styles.tradeTitle}>{item.trade.title}</Text>
              <Text numberOfLines={1} style={styles.preview}>{item.lastMessage?.preview || '아직 메시지가 없어요.'}</Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.surface },
  listContent: { flexGrow: 1, padding: 14, gap: 10 },
  emptyState: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  muted: { marginTop: 5, color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { minHeight: 44, marginTop: 5, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  retryText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  socketError: { margin: 12, marginBottom: 0, padding: 10, borderRadius: 10, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 12, textAlign: 'center' },
  roomCard: { minHeight: 98, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background },
  pressed: { opacity: 0.72 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  roomCopy: { flex: 1, minWidth: 0 },
  roomTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partnerName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
  time: { color: colors.textMuted, fontSize: 10 },
  tradeTitle: { marginTop: 5, color: colors.primary, fontSize: 12, fontWeight: '700' },
  preview: { marginTop: 5, color: colors.textMuted, fontSize: 12 },
  unreadBadge: { minWidth: 23, height: 23, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary },
  unreadText: { color: colors.background, fontSize: 10, fontWeight: '800' },
});
