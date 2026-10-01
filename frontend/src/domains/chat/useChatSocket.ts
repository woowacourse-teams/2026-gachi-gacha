import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';

import { readAccessToken } from '@/features/auth/authTokenStorage';

import type { ChatMessage } from './chatType';

export type ChatSocketStatus =
  'connecting' | 'connected' | 'disconnected' | 'error';

interface UseChatSocketOptions {
  roomId: number | undefined;
  memberId: string | null;
  onMessage: (message: ChatMessage) => void;
}

interface UseChatSocketResult {
  status: ChatSocketStatus;
  errorMessage: string | null;
  sendTextMessage: (content: string) => Promise<void>;
}

const RECONNECT_DELAY = 5_000;
const HEARTBEAT_INTERVAL = 10_000;

export function useChatSocket({
  roomId,
  memberId,
  onMessage,
}: UseChatSocketOptions): UseChatSocketResult {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState<ChatSocketStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomId) {
      setStatus('disconnected');
      return;
    }

    if (__USE_MSW__) {
      setStatus('connected');
      setErrorMessage(null);
      return;
    }

    const client = new Client({
      brokerURL: createWebSocketUrl(),
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: HEARTBEAT_INTERVAL,
      heartbeatOutgoing: HEARTBEAT_INTERVAL,
      debug: () => undefined,
      beforeConnect: async () => {
        const accessToken = readAccessToken();

        if (!accessToken) {
          throw new Error('로그인이 필요한 기능입니다.');
        }

        client.connectHeaders = {
          Authorization: `Bearer ${accessToken}`,
        };
        setStatus('connecting');
      },
      onConnect: () => {
        setStatus('connected');
        setErrorMessage(null);
        client.subscribe(`/topic/chat/rooms/${roomId}/messages`, (frame) => {
          handleMessageFrame(frame, onMessageRef.current);
        });
        client.subscribe('/user/queue/chat/errors', (frame) => {
          setErrorMessage(readSocketError(frame));
        });
      },
      onStompError: (frame) => {
        setStatus('error');
        setErrorMessage(frame.headers.message || '채팅 연결에 실패했습니다.');
      },
      onWebSocketError: () => {
        setStatus('error');
        setErrorMessage('채팅 서버에 연결하지 못했습니다.');
      },
      onWebSocketClose: () => {
        setStatus('disconnected');
      },
    });

    clientRef.current = client;
    setStatus('connecting');
    client.activate();

    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, [roomId]);

  const sendTextMessage = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();

      if (!roomId || !normalizedContent) {
        return;
      }

      if (__USE_MSW__) {
        onMessageRef.current({
          messageId: `mock-${Date.now()}`,
          sequence: Date.now(),
          roomId,
          senderId: Number(memberId ?? 3),
          type: 'TEXT',
          content: normalizedContent,
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const client = clientRef.current;

      if (!client?.connected) {
        throw new Error(
          '채팅 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.',
        );
      }

      client.publish({
        destination: `/app/chat/rooms/${roomId}/messages`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'TEXT',
          content: normalizedContent,
          files: [],
        }),
      });
    },
    [memberId, roomId],
  );

  return { status, errorMessage, sendTextMessage };
}

function createWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${window.location.host}/api/v1/ws`;
}

function handleMessageFrame(
  frame: IMessage,
  onMessage: (message: ChatMessage) => void,
): void {
  try {
    onMessage(JSON.parse(frame.body) as ChatMessage);
  } catch {
    // 형식이 올바르지 않은 프레임 하나가 이후 메시지 수신을 막지 않도록 무시합니다.
  }
}

function readSocketError(frame: IMessage): string {
  try {
    const body = JSON.parse(frame.body) as { message?: unknown };

    return typeof body.message === 'string'
      ? body.message
      : '메시지를 전송하지 못했습니다.';
  } catch {
    return '메시지를 전송하지 못했습니다.';
  }
}
