import { useCallback, useEffect, useMemo, useState } from 'react';

import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { GachaSearchBar } from '@/features/gachaSearch/GachaSearchBar';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationResponseItem,
} from '@/features/notifications/api/notificationApi';
import { useOptionalNotifications } from '@/features/notifications/NotificationContext';
import { assignBrowserLocation } from '@/shared/browser/browserNavigation';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import type { AsyncState } from '@/shared/hooks/asyncStateType';
import { AppHeader } from '@/shared/ui/AppHeader';

import {
  ActionError,
  EmptyDescription,
  HeaderActions,
  Heading,
  HeadingArea,
  ItemBody,
  ItemLink,
  ItemMeta,
  ItemTitle,
  List,
  ListCard,
  LoadMoreButton,
  Main,
  MarkAllButton,
  Page,
  PageDescription,
  StatePanel,
  StateTitle,
  UnreadBadge,
  UnreadDot,
} from './route.styles';

const PAGE_SIZE = 20;

function openGachaSearchResults(gachaId: number) {
  assignBrowserLocation(createGachaSearchResultsUrl(gachaId));
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function NotificationsRoute() {
  const notificationContext = useOptionalNotifications();
  const [state, setState] = useState<
    AsyncState<readonly NotificationResponseItem[]>
  >({ status: 'loading', data: null, errorMessage: null });
  const [nextLastNotificationId, setNextLastNotificationId] = useState<
    number | null
  >(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async (signal?: AbortSignal) => {
    setState({ status: 'loading', data: null, errorMessage: null });
    setLoadMoreError(null);

    try {
      const page = await getNotifications({ size: PAGE_SIZE, signal });
      setState({
        status: 'success',
        data: page.notifications,
        errorMessage: null,
      });
      setNextLastNotificationId(page.nextLastNotificationId);
      setHasNext(page.hasNext);
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setState({
        status: 'error',
        data: null,
        errorMessage: getErrorMessage(error, '알림을 불러오지 못했습니다.'),
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadFirstPage(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadFirstPage]);

  const unreadCount = useMemo(
    () =>
      state.status === 'success'
        ? state.data.filter(({ read }) => !read).length
        : 0,
    [state],
  );

  async function loadMore() {
    if (
      state.status !== 'success' ||
      !hasNext ||
      nextLastNotificationId === null ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const page = await getNotifications({
        lastNotificationId: nextLastNotificationId,
        size: PAGE_SIZE,
      });
      setState((currentState) =>
        currentState.status === 'success'
          ? {
              ...currentState,
              data: [...currentState.data, ...page.notifications],
            }
          : currentState,
      );
      setNextLastNotificationId(page.nextLastNotificationId);
      setHasNext(page.hasNext);
    } catch (error) {
      setLoadMoreError(
        getErrorMessage(error, '알림을 더 불러오지 못했습니다.'),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function selectNotification(notification: NotificationResponseItem) {
    if (notification.read) {
      return;
    }

    setState((currentState) =>
      currentState.status === 'success'
        ? {
            ...currentState,
            data: currentState.data.map((item) =>
              item.notificationId === notification.notificationId
                ? { ...item, read: true }
                : item,
            ),
          }
        : currentState,
    );

    if (notificationContext) {
      notificationContext.selectNotification({
        id: String(notification.notificationId),
        type: 'comment',
        title: notification.title,
        message: notification.body,
        createdAtLabel: formatRelativeTime(notification.createdAt),
        isRead: false,
        destination: `/trade/${notification.tradeId}`,
      });
      return;
    }

    void markNotificationRead(String(notification.notificationId));
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);
    setActionError(null);

    try {
      if (notificationContext) {
        await notificationContext.readAllNotifications();
      } else {
        await markAllNotificationsRead();
      }

      setState((currentState) =>
        currentState.status === 'success'
          ? {
              ...currentState,
              data: currentState.data.map((notification) => ({
                ...notification,
                read: true,
              })),
            }
          : currentState,
      );
    } catch (error) {
      setActionError(
        getErrorMessage(error, '알림을 모두 읽음 처리하지 못했습니다.'),
      );
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <Page>
      <AppHeader
        currentPath="/notifications"
        search={<GachaSearchBar onSelect={openGachaSearchResults} />}
      />
      <Main>
        <HeadingArea>
          <div>
            <Heading>알림</Heading>
            <PageDescription>
              내 교환글에 달린 새로운 댓글을 확인해요.
            </PageDescription>
          </div>
          <HeaderActions>
            {unreadCount > 0 && (
              <UnreadBadge>{unreadCount}개 안 읽음</UnreadBadge>
            )}
            <MarkAllButton
              type="button"
              disabled={unreadCount === 0 || isMarkingAll}
              onClick={() => void markAllAsRead()}
            >
              {isMarkingAll ? '처리 중…' : '모두 읽음'}
            </MarkAllButton>
          </HeaderActions>
        </HeadingArea>

        {actionError && <ActionError role="alert">{actionError}</ActionError>}

        <ListCard aria-live="polite">
          {state.status === 'loading' || state.status === 'idle' ? (
            <StatePanel role="status">
              <StateTitle>알림을 불러오고 있어요</StateTitle>
            </StatePanel>
          ) : state.status === 'error' ? (
            <StatePanel role="alert">
              <StateTitle>알림을 불러오지 못했어요</StateTitle>
              <EmptyDescription>{state.errorMessage}</EmptyDescription>
              <LoadMoreButton
                type="button"
                onClick={() => void loadFirstPage()}
              >
                다시 시도
              </LoadMoreButton>
            </StatePanel>
          ) : state.data.length === 0 ? (
            <StatePanel>
              <StateTitle>아직 받은 알림이 없어요</StateTitle>
              <EmptyDescription>
                내 교환글에 댓글이 달리면 이곳에 모아 보여드릴게요.
              </EmptyDescription>
            </StatePanel>
          ) : (
            <>
              <List aria-label="전체 알림">
                {state.data.map((notification) => (
                  <li key={notification.notificationId}>
                    <ItemLink
                      to={`/trade/${notification.tradeId}`}
                      $unread={!notification.read}
                      onClick={() => selectNotification(notification)}
                    >
                      <ItemMeta>
                        <span>댓글</span>
                        <time dateTime={notification.createdAt}>
                          {formatRelativeTime(notification.createdAt)}
                        </time>
                      </ItemMeta>
                      <ItemTitle>
                        {!notification.read && <UnreadDot aria-hidden="true" />}
                        {notification.title}
                      </ItemTitle>
                      <ItemBody>{notification.body}</ItemBody>
                    </ItemLink>
                  </li>
                ))}
              </List>
              {(hasNext || loadMoreError) && (
                <StatePanel $compact>
                  {loadMoreError && (
                    <ActionError role="alert">{loadMoreError}</ActionError>
                  )}
                  <LoadMoreButton
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => void loadMore()}
                  >
                    {isLoadingMore ? '불러오는 중…' : '알림 더보기'}
                  </LoadMoreButton>
                </StatePanel>
              )}
            </>
          )}
        </ListCard>
      </Main>
    </Page>
  );
}
