import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Client as StompClient, IMessage } from '@stomp/stompjs';
import { useLocation } from 'react-router';

import { getChatUnreadCount } from '@/domains/chat/api/chatApi';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

interface ChatUnreadContextValue {
  unreadCount: number;
  updateUnreadCount: (unreadCount: number) => void;
}

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isChatPath(pathname: string): boolean {
  return pathname === '/chat' || pathname.startsWith('/chat/');
}

export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const { status } = useAuthSession();
  const { pathname } = useLocation();
  const usesChatRouteSocket = isChatPath(pathname);
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = useCallback((nextUnreadCount: number) => {
    if (Number.isSafeInteger(nextUnreadCount) && nextUnreadCount >= 0) {
      setUnreadCount(nextUnreadCount);
    }
  }, []);

  const loadUnreadCount = useCallback(
    async (signal?: AbortSignal, captureInitialLoad = false) => {
      try {
        setUnreadCount(await getChatUnreadCount(signal));

        if (captureInitialLoad) {
          captureAnalyticsEvent('unread_count_initial_load_completed', {
            channel: 'chat',
            outcome: 'success',
          });
        }
      } catch (error) {
        if (!isAbortError(error)) {
          // 일시적인 조회 실패가 이미 표시 중인 수를 지우지 않도록 유지합니다.
          if (captureInitialLoad) {
            captureAnalyticsEvent('unread_count_initial_load_completed', {
              channel: 'chat',
              outcome: 'failure',
            });
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCount(0);
      return;
    }

    const controller = new AbortController();
    void loadUnreadCount(controller.signal, true);

    return () => {
      controller.abort();
    };
  }, [loadUnreadCount, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        void loadUnreadCount();
      }
    }

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadUnreadCount, status]);

  useEffect(() => {
    if (status !== 'authenticated' || usesChatRouteSocket || __USE_MSW__) {
      return;
    }

    let isActive = true;
    let client: StompClient | null = null;

    void import('@/domains/chat/createChatStompClient')
      .then(({ createChatStompClient }) => {
        if (!isActive) {
          return;
        }

        const nextClient = createChatStompClient({
          onConnect: (connectedClient) => {
            if (!isActive) {
              return;
            }

            void loadUnreadCount();
            connectedClient.subscribe('/user/queue/chat/rooms', (frame) => {
              const nextUnreadCount = readUnreadCountFrame(frame);

              if (nextUnreadCount !== null) {
                updateUnreadCount(nextUnreadCount);
              }
            });
          },
        });

        client = nextClient;
        nextClient.activate();
      })
      .catch(() => {
        // 소켓 청크를 불러오지 못해도 REST로 조회한 배지는 유지합니다.
      });

    return () => {
      isActive = false;
      void client?.deactivate();
    };
  }, [loadUnreadCount, status, updateUnreadCount, usesChatRouteSocket]);

  const value = useMemo<ChatUnreadContextValue>(
    () => ({ unreadCount, updateUnreadCount }),
    [unreadCount, updateUnreadCount],
  );

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useOptionalChatUnread(): ChatUnreadContextValue | null {
  return useContext(ChatUnreadContext);
}

function readUnreadCountFrame(frame: IMessage): number | null {
  try {
    const parsed: unknown = JSON.parse(frame.body);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('totalUnreadCount' in parsed)
    ) {
      return null;
    }

    const { totalUnreadCount } = parsed;

    return Number.isSafeInteger(totalUnreadCount) &&
      Number(totalUnreadCount) >= 0
      ? Number(totalUnreadCount)
      : null;
  } catch {
    return null;
  }
}
