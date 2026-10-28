import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiBaseUrl } from '../../config/api';
import { readAuthTokens } from '../auth/authTokenStorage';
import type {
  ChatMessage,
  ChatMessageFile,
  ChatRoomUpdate,
} from './chatTypes';
import { parseChatMessage, parseChatRoom } from './chatApi';

export type ChatSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type Options = {
  active: boolean;
  memberId: number | null;
  onMessage: (message: ChatMessage) => void;
  onRoomUpdate: (update: ChatRoomUpdate) => void;
  roomId: number | null;
};

function createWebSocketUrl(): string {
  const url = new URL(getApiBaseUrl());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/api/v1/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function parseRoomUpdate(value: unknown): ChatRoomUpdate {
  if (typeof value !== 'object' || value === null || !('room' in value)) {
    throw new Error('채팅방 갱신 응답 형식이 올바르지 않습니다.');
  }
  const totalUnreadCount = 'totalUnreadCount' in value ? value.totalUnreadCount : null;
  if (!Number.isSafeInteger(totalUnreadCount) || Number(totalUnreadCount) < 0) {
    throw new Error('채팅방 갱신 응답 형식이 올바르지 않습니다.');
  }
  return { room: parseChatRoom(value.room), totalUnreadCount: Number(totalUnreadCount) };
}

export function useChatSocket({ active, memberId, onMessage, onRoomUpdate, roomId }: Options) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  const onRoomUpdateRef = useRef(onRoomUpdate);
  const [status, setStatus] = useState<ChatSocketStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onRoomUpdateRef.current = onRoomUpdate; }, [onRoomUpdate]);

  useEffect(() => {
    if (!active || memberId === null) {
      setStatus('disconnected');
      return;
    }

    const client = new Client({
      brokerURL: createWebSocketUrl(),
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
      beforeConnect: async () => {
        const tokens = await readAuthTokens();
        if (!tokens) throw new Error('로그인이 필요한 기능입니다.');
        client.connectHeaders = { Authorization: `Bearer ${tokens.accessToken}` };
        setStatus('connecting');
      },
      onConnect: () => {
        setStatus('connected');
        setErrorMessage(null);
        if (roomId !== null) {
          client.subscribe(`/topic/chat/rooms/${roomId}/messages`, (frame) => {
            try { onMessageRef.current(parseChatMessage(JSON.parse(frame.body) as unknown)); } catch { /* malformed frame */ }
          });
        }
        client.subscribe('/user/queue/chat/rooms', (frame) => {
          try { onRoomUpdateRef.current(parseRoomUpdate(JSON.parse(frame.body) as unknown)); } catch { /* malformed frame */ }
        });
        client.subscribe('/user/queue/chat/errors', (frame) => {
          try {
            const body = JSON.parse(frame.body) as { message?: unknown };
            setErrorMessage(typeof body.message === 'string' ? body.message : '메시지를 전송하지 못했습니다.');
          } catch {
            setErrorMessage('메시지를 전송하지 못했습니다.');
          }
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
      onWebSocketClose: () => setStatus('disconnected'),
    });

    clientRef.current = client;
    setStatus('connecting');
    client.activate();
    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, [active, memberId, roomId]);

  const publish = useCallback((type: 'TEXT' | 'IMAGE', content: string | null, files: ChatMessageFile[]) => {
    const client = clientRef.current;
    if (roomId === null || !client?.connected) {
      throw new Error('채팅 서버에 연결 중입니다. 잠시 후 다시 시도해 주세요.');
    }
    client.publish({
      destination: `/app/chat/rooms/${roomId}/messages`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content, files, type }),
    });
  }, [roomId]);

  return {
    errorMessage,
    sendImageMessage: (content: string, files: ChatMessageFile[]) =>
      publish('IMAGE', content.trim() || null, files),
    sendTextMessage: (content: string) => publish('TEXT', content.trim(), []),
    status,
  };
}
