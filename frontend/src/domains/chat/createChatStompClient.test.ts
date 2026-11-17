import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { subscribeToAuthenticationExpired } from '@/features/auth/api/authenticatedFetch';
import {
  clearAuthTokens,
  readAccessToken,
  readRefreshToken,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import { createChatStompClient } from './createChatStompClient';

interface MockStompConfig {
  reconnectDelay: number;
  reconnectTimeMode: number;
  maxReconnectDelay: number;
  beforeConnect: () => Promise<void>;
  onConnect: () => void;
  onStompError: (frame: { headers: Record<string, string> }) => void;
}

interface MockStompClient {
  connectHeaders: Record<string, string>;
  deactivate: jest.Mock<() => Promise<void>>;
}

let mockConfig: MockStompConfig | null = null;
let mockClient: MockStompClient | null = null;

jest.mock('@stomp/stompjs', () => ({
  ReconnectionTimeMode: { LINEAR: 0, EXPONENTIAL: 1 },
  Client: jest.fn().mockImplementation((config) => {
    mockConfig = config as MockStompConfig;
    mockClient = {
      connectHeaders: {},
      deactivate: jest.fn<() => Promise<void>>().mockResolvedValue(),
    };

    return mockClient;
  }),
}));

const UNAUTHORIZED_TOKEN_FRAME = { headers: { message: 'CE005' } };

function createClient() {
  const onConnect = jest.fn();

  createChatStompClient({ onConnect });

  if (!mockConfig || !mockClient) {
    throw new Error('STOMP 클라이언트가 생성되지 않았습니다.');
  }

  return { config: mockConfig, client: mockClient, onConnect };
}

function useRefreshHandler(resolver: () => Response) {
  const refreshRequest = jest.fn();

  server.use(
    http.post('/api/v1/auth/refresh', () => {
      refreshRequest();

      return resolver();
    }),
  );

  return refreshRequest;
}

describe('createChatStompClient', () => {
  beforeEach(() => {
    mockConfig = null;
    mockClient = null;
    storeAuthTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('저장된 access token으로 연결하고 재연결 간격을 지수적으로 늘린다', async () => {
    const { config, client } = createClient();

    await config.beforeConnect();

    expect(client.connectHeaders).toEqual({
      Authorization: 'Bearer expired-access-token',
    });
    expect(config.reconnectDelay).toBe(5_000);
    expect(config.reconnectTimeMode).toBe(1);
    expect(config.maxReconnectDelay).toBe(60_000);
  });

  it('토큰이 거부되면 다음 연결 전에 토큰을 갱신해 새 토큰으로 연결한다', async () => {
    const refreshRequest = useRefreshHandler(() =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }),
    );
    const { config, client } = createClient();

    await config.beforeConnect();
    config.onStompError(UNAUTHORIZED_TOKEN_FRAME);
    await config.beforeConnect();

    expect(refreshRequest).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({
      Authorization: 'Bearer new-access-token',
    });
    expect(readAccessToken()).toBe('new-access-token');
    expect(readRefreshToken()).toBe('new-refresh-token');
    expect(client.deactivate).not.toHaveBeenCalled();
  });

  it('갱신한 뒤 연결에 성공하면 이후 재연결에서 다시 갱신하지 않는다', async () => {
    const refreshRequest = useRefreshHandler(() =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }),
    );
    const { config, onConnect } = createClient();

    await config.beforeConnect();
    config.onStompError(UNAUTHORIZED_TOKEN_FRAME);
    await config.beforeConnect();
    config.onConnect();
    await config.beforeConnect();

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(refreshRequest).toHaveBeenCalledTimes(1);
  });

  it('refresh token도 만료됐으면 인증을 만료시키고 재연결을 멈춘다', async () => {
    useRefreshHandler(() =>
      HttpResponse.json(
        { code: 'AUE06', message: '만료된 refresh token입니다.', data: null },
        { status: 401 },
      ),
    );
    const onAuthenticationExpired = jest.fn();
    const unsubscribe = subscribeToAuthenticationExpired(
      onAuthenticationExpired,
    );
    const { config, client } = createClient();

    await config.beforeConnect();
    config.onStompError(UNAUTHORIZED_TOKEN_FRAME);
    client.connectHeaders = {};
    await config.beforeConnect();
    unsubscribe();

    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({});
    expect(readAccessToken()).toBeNull();
    expect(onAuthenticationExpired).toHaveBeenCalledTimes(1);
  });

  it('갱신이 일시적으로 실패하면 재연결을 유지하고 다음 연결에서 다시 갱신한다', async () => {
    let isRefreshAvailable = false;
    const refreshRequest = useRefreshHandler(() =>
      isRefreshAvailable
        ? HttpResponse.json({
            code: 'C000',
            message: '정상',
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
            },
          })
        : HttpResponse.json(
            { code: 'C500', message: '서버 오류', data: null },
            { status: 500 },
          ),
    );
    const { config, client } = createClient();

    await config.beforeConnect();
    config.onStompError(UNAUTHORIZED_TOKEN_FRAME);
    await config.beforeConnect();

    expect(client.deactivate).not.toHaveBeenCalled();
    expect(client.connectHeaders).toEqual({
      Authorization: 'Bearer expired-access-token',
    });

    isRefreshAvailable = true;
    config.onStompError(UNAUTHORIZED_TOKEN_FRAME);
    await config.beforeConnect();

    expect(refreshRequest).toHaveBeenCalledTimes(2);
    expect(client.connectHeaders).toEqual({
      Authorization: 'Bearer new-access-token',
    });
  });

  it('토큰 문제가 아닌 STOMP 오류에는 토큰을 갱신하지 않는다', async () => {
    const refreshRequest = useRefreshHandler(() =>
      HttpResponse.json({ code: 'C500', message: '서버 오류', data: null }),
    );
    const { config, client } = createClient();

    await config.beforeConnect();
    config.onStompError({ headers: { message: 'CE003' } });
    await config.beforeConnect();

    expect(refreshRequest).not.toHaveBeenCalled();
    expect(client.connectHeaders).toEqual({
      Authorization: 'Bearer expired-access-token',
    });
  });

  it('저장된 access token이 없으면 연결하지 않고 재연결을 멈춘다', async () => {
    clearAuthTokens();
    const { config, client } = createClient();

    await config.beforeConnect();

    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({});
  });
});
