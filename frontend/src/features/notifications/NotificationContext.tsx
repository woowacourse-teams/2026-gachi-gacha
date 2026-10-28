import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import type {
  HeaderNotification,
  HeaderNotificationState,
} from '@/shared/ui/NotificationPopover';

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './api/notificationApi';

interface NotificationContextValue {
  notificationState: HeaderNotificationState;
  unreadCount: number;
  loadNotifications: () => void;
  selectNotification: (notification: HeaderNotification) => void;
  readAllNotifications: () => Promise<void>;
}

const IDLE_NOTIFICATION_STATE: HeaderNotificationState = {
  status: 'idle',
  data: null,
  errorMessage: null,
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status } = useAuthSession();
  const [notificationState, setNotificationState] =
    useState<HeaderNotificationState>(IDLE_NOTIFICATION_STATE);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      setUnreadCount(await getUnreadNotificationCount(signal));
    } catch (error) {
      if (!isAbortError(error)) {
        setUnreadCount(0);
      }
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCount(0);
      setNotificationState(IDLE_NOTIFICATION_STATE);
      return;
    }

    const controller = new AbortController();
    void refreshUnreadCount(controller.signal);

    return () => {
      controller.abort();
    };
  }, [refreshUnreadCount, status]);

  const loadNotifications = useCallback(() => {
    if (status !== 'authenticated') {
      return;
    }

    setNotificationState({
      status: 'loading',
      data: null,
      errorMessage: null,
    });

    void getNotifications()
      .then(({ notifications }) => {
        setNotificationState({
          status: 'success',
          data: notifications.map(
            ({ notificationId, title, body, tradeId, read, createdAt }) => ({
              id: String(notificationId),
              type: 'comment' as const,
              title,
              message: body,
              createdAtLabel: formatRelativeTime(createdAt),
              isRead: read,
              destination: `/trade/${tradeId}`,
            }),
          ),
          errorMessage: null,
        });
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        setNotificationState({
          status: 'error',
          data: null,
          errorMessage:
            error instanceof Error
              ? error.message
              : '알림을 불러오지 못했습니다.',
        });
      });
  }, [status]);

  const selectNotification = useCallback(
    (notification: HeaderNotification) => {
      if (notification.isRead) {
        return;
      }

      setNotificationState((currentState) => {
        if (currentState.status !== 'success') {
          return currentState;
        }

        return {
          ...currentState,
          data: currentState.data.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        };
      });

      void markNotificationRead(notification.id)
        .then(() => refreshUnreadCount())
        .catch(() => {
          loadNotifications();
          void refreshUnreadCount();
        });
    },
    [loadNotifications, refreshUnreadCount],
  );

  const readAllNotifications = useCallback(async () => {
    await markAllNotificationsRead();
    setNotificationState((currentState) => {
      if (currentState.status !== 'success') {
        return currentState;
      }

      return {
        ...currentState,
        data: currentState.data.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      };
    });
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notificationState,
      unreadCount,
      loadNotifications,
      selectNotification,
      readAllNotifications,
    }),
    [
      loadNotifications,
      notificationState,
      readAllNotifications,
      selectNotification,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useOptionalNotifications(): NotificationContextValue | null {
  return useContext(NotificationContext);
}
