import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuthSession } from '../auth/AuthSessionContext';
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationApi';

type Value = {
  markAllRead: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  unreadCount: number;
};

const NotificationContext = createContext<Value | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status } = useAuthSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      setUnreadCount(await getUnreadNotificationCount(signal));
    } catch {
      if (!signal?.aborted) setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCount(0);
      return;
    }

    const controller = new AbortController();
    void refreshUnreadCount(controller.signal);
    return () => controller.abort();
  }, [refreshUnreadCount, status]);

  const markRead = useCallback(async (notificationId: number) => {
    await markNotificationRead(notificationId);
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
  }, []);

  const value = useMemo<Value>(
    () => ({
      markAllRead,
      markRead,
      refreshUnreadCount: () => refreshUnreadCount(),
      unreadCount,
    }),
    [markAllRead, markRead, refreshUnreadCount, unreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): Value {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications는 NotificationProvider 안에서 사용해야 합니다.');
  return value;
}
