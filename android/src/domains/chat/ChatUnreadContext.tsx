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
import { getUnreadChatCount } from './chatApi';

type Value = {
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  unreadCount: number;
};

const ChatUnreadContext = createContext<Value | null>(null);

export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const { status } = useAuthSession();
  const [unreadCount, setUnreadCountState] = useState(0);

  const refreshUnreadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      setUnreadCountState(await getUnreadChatCount(signal));
    } catch {
      if (!signal?.aborted) setUnreadCountState(0);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCountState(0);
      return;
    }
    const controller = new AbortController();
    void refreshUnreadCount(controller.signal);
    return () => controller.abort();
  }, [refreshUnreadCount, status]);

  const value = useMemo<Value>(
    () => ({
      refreshUnreadCount: () => refreshUnreadCount(),
      setUnreadCount: (count) => setUnreadCountState(Math.max(0, count)),
      unreadCount,
    }),
    [refreshUnreadCount, unreadCount],
  );

  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}

export function useChatUnread(): Value {
  const value = useContext(ChatUnreadContext);
  if (!value) throw new Error('useChatUnread는 ChatUnreadProvider 안에서 사용해야 합니다.');
  return value;
}
