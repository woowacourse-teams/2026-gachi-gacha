import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getNotifications,
} from '../domains/notification/notificationApi';
import { useNotifications } from '../domains/notification/NotificationContext';
import type {
  NotificationItem,
  NotificationPage,
} from '../domains/notification/notificationTypes';
import type { RootStackParamList } from '../navigation/RootStack';
import { useBottomContentPadding } from '../shared/useBottomContentPadding';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
type State = {
  data: NotificationPage | null;
  errorMessage: string | null;
  status: 'loading' | 'success' | 'error';
};

function formatRelativeTime(value: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function NotificationsScreen({ navigation }: Props) {
  const bottomContentPadding = useBottomContentPadding();
  const { markAllRead, markRead, unreadCount } = useNotifications();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ data: null, errorMessage: null, status: 'loading' });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, errorMessage: null, status: 'loading' });
    getNotifications({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, errorMessage: null, status: 'success' });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            data: null,
            errorMessage: error instanceof Error ? error.message : '알림을 불러오지 못했습니다.',
            status: 'error',
          });
        }
      });
    return () => controller.abort();
  }, [attempt]);

  const loadedUnreadCount = useMemo(
    () => state.data?.notifications.filter(({ read }) => !read).length ?? 0,
    [state.data],
  );
  const visibleUnreadCount = Math.max(unreadCount, loadedUnreadCount);

  const loadMore = useCallback(async () => {
    if (
      state.status !== 'success' ||
      !state.data?.hasNext ||
      state.data.nextLastNotificationId === null ||
      isLoadingMore
    ) return;

    setIsLoadingMore(true);
    setActionError(null);
    try {
      const page = await getNotifications({
        lastNotificationId: state.data.nextLastNotificationId,
      });
      setState((current) => {
        if (current.status !== 'success' || !current.data) return current;
        const ids = new Set(current.data.notifications.map(({ notificationId }) => notificationId));
        return {
          data: {
            ...page,
            notifications: [
              ...current.data.notifications,
              ...page.notifications.filter(({ notificationId }) => !ids.has(notificationId)),
            ],
          },
          errorMessage: null,
          status: 'success',
        };
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '알림을 더 불러오지 못했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, state]);

  function openNotification(notification: NotificationItem) {
    if (!notification.read) {
      setState((current) =>
        current.status === 'success' && current.data
          ? {
              ...current,
              data: {
                ...current.data,
                notifications: current.data.notifications.map((item) =>
                  item.notificationId === notification.notificationId
                    ? { ...item, read: true }
                    : item,
                ),
              },
            }
          : current,
      );
      void markRead(notification.notificationId).catch(() => undefined);
    }

    navigation.navigate('Main', {
      screen: 'Trade',
      params: { screen: 'TradeDetail', params: { tradeId: notification.tradeId } },
    });
  }

  async function markAll() {
    if (visibleUnreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    setActionError(null);
    try {
      await markAllRead();
      setState((current) =>
        current.status === 'success' && current.data
          ? {
              ...current,
              data: {
                ...current.data,
                notifications: current.data.notifications.map((item) => ({ ...item, read: true })),
              },
            }
          : current,
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '알림을 모두 읽음 처리하지 못했습니다.');
    } finally {
      setIsMarkingAll(false);
    }
  }

  if (state.status === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.muted}>알림을 불러오고 있어요.</Text></View>;
  }

  if (state.status === 'error' || !state.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>알림을 불러오지 못했어요</Text>
        <Text style={styles.muted}>{state.errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => setAttempt((current) => current + 1)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>댓글 알림</Text>
          <Text style={styles.muted}>내 교환글에 달린 새 댓글을 확인해요.</Text>
        </View>
        {visibleUnreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{visibleUnreadCount}개 안 읽음</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={visibleUnreadCount === 0 || isMarkingAll}
          onPress={() => void markAll()}
          style={styles.markAllButton}
        >
          <Text style={styles.markAllText}>{isMarkingAll ? '처리 중…' : '모두 읽음'}</Text>
        </Pressable>
      </View>
      {actionError && <Text style={styles.actionError}>{actionError}</Text>}
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomContentPadding },
        ]}
        data={state.data.notifications}
        keyExtractor={({ notificationId }) => String(notificationId)}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.stateTitle}>아직 받은 알림이 없어요</Text>
            <Text style={styles.muted}>내 교환글에 댓글이 달리면 이곳에 모아 보여드릴게요.</Text>
          </View>
        )}
        ListFooterComponent={state.data.hasNext ? (
          <Pressable
            accessibilityRole="button"
            disabled={isLoadingMore}
            onPress={() => void loadMore()}
            style={styles.moreButton}
          >
            {isLoadingMore && <ActivityIndicator color={colors.primary} size="small" />}
            <Text style={styles.moreText}>{isLoadingMore ? '불러오는 중…' : '알림 더보기'}</Text>
          </Pressable>
        ) : null}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => openNotification(item)}
            style={({ pressed }) => [
              styles.notification,
              !item.read && styles.notificationUnread,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.metaRow}>
              <Text style={styles.meta}>댓글</Text>
              <Text style={styles.meta}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <View style={styles.titleRow}>
              {!item.read && <View style={styles.unreadDot} />}
              <Text numberOfLines={2} style={styles.notificationTitle}>{item.title}</Text>
            </View>
            <Text numberOfLines={3} style={styles.notificationBody}>{item.body}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 13, backgroundColor: colors.surface },
  summary: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.background },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  muted: { marginTop: 5, color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  unreadBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.primarySoft },
  unreadBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  markAllButton: { minHeight: 38, paddingHorizontal: 11, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 19 },
  markAllText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  actionError: { margin: 14, padding: 11, borderRadius: 11, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 12, textAlign: 'center' },
  listContent: { flexGrow: 1, padding: 14, gap: 10 },
  emptyState: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 4 },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  primaryButton: { minHeight: 44, marginTop: 4, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  notification: { padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 17, backgroundColor: colors.background },
  notificationUnread: { borderColor: 'rgba(217, 59, 84, 0.3)', backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.72 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: colors.textMuted, fontSize: 11 },
  titleRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  notificationTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  notificationBody: { marginTop: 7, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  moreButton: { minHeight: 44, marginTop: 6, paddingHorizontal: 18, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.background },
  moreText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});
