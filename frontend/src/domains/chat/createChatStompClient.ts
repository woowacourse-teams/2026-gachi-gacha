import { Client, type IFrame, ReconnectionTimeMode } from '@stomp/stompjs';

import { refreshRejectedAccessToken } from '@/features/auth/api/authenticatedFetch';
import { readAccessToken } from '@/features/auth/authTokenStorage';

const RECONNECT_DELAY = 5_000;
const MAX_RECONNECT_DELAY = 60_000;
const HEARTBEAT_INTERVAL = 10_000;
/** 서버가 CONNECT의 access token을 거부할 때 ERROR 프레임에 담는 코드. */
const UNAUTHORIZED_TOKEN_ERROR_CODE = 'CE005';

interface ChatStompClientOptions {
  onConnect: (client: Client) => void;
  onConnecting?: () => void;
  onStompError?: (frame: IFrame) => void;
  onWebSocketError?: () => void;
  onWebSocketClose?: () => void;
}

/**
 * 채팅 화면과 미읽음 배지가 함께 쓰는 STOMP 클라이언트를 만든다.
 *
 * 서버가 access token을 거부하면 다음 재연결 전에 토큰을 갱신하고,
 * 다시 로그인해야 하는 상태면 재연결을 멈춘다. 그 밖의 연결 실패는
 * 재시도 간격을 늘려 같은 요청이 짧은 주기로 반복되지 않게 한다.
 */
export function createChatStompClient({
  onConnect,
  onConnecting,
  onStompError,
  onWebSocketError,
  onWebSocketClose,
}: ChatStompClientOptions): Client {
  let sentAccessToken: string | null = null;
  let rejectedAccessToken: string | null = null;

  async function resolveAccessToken(): Promise<string | null> {
    if (!rejectedAccessToken) {
      return readAccessToken();
    }

    try {
      const accessToken = await refreshRejectedAccessToken(rejectedAccessToken);

      rejectedAccessToken = null;

      return accessToken;
    } catch {
      // 갱신이 일시적으로 실패하면 기존 토큰으로 연결을 시도한다.
      // 다시 거부되면 늘어난 간격 뒤에 갱신부터 재시도한다.
      return readAccessToken();
    }
  }

  const client = new Client({
    brokerURL: createWebSocketUrl(),
    reconnectDelay: RECONNECT_DELAY,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: MAX_RECONNECT_DELAY,
    heartbeatIncoming: HEARTBEAT_INTERVAL,
    heartbeatOutgoing: HEARTBEAT_INTERVAL,
    debug: () => undefined,
    beforeConnect: async () => {
      const accessToken = await resolveAccessToken();

      if (!accessToken) {
        // 보낼 토큰이 없으면 연결해도 거부되므로 재연결을 멈춘다.
        void client.deactivate();
        return;
      }

      sentAccessToken = accessToken;
      client.connectHeaders = { Authorization: `Bearer ${accessToken}` };
      onConnecting?.();
    },
    onConnect: () => {
      rejectedAccessToken = null;
      onConnect(client);
    },
    onStompError: (frame) => {
      if (frame.headers.message === UNAUTHORIZED_TOKEN_ERROR_CODE) {
        rejectedAccessToken = sentAccessToken;
      }

      onStompError?.(frame);
    },
    onWebSocketError: () => {
      onWebSocketError?.();
    },
    onWebSocketClose: () => {
      onWebSocketClose?.();
    },
  });

  return client;
}

function createWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${window.location.host}/api/v1/ws`;
}
