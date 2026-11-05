import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { AppHeader } from '@/shared/ui/AppHeader';
import { server } from '@/test/server';

import { ChatUnreadProvider } from './ChatUnreadContext';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
  syncAnalyticsUser: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

interface MockStompConfig {
  beforeConnect?: () => Promise<void>;
  onConnect?: () => void;
}

interface MockFrame {
  body: string;
}

let mockRoomUpdateHandler: ((frame: MockFrame) => void) | null = null;
const mockActivate = jest.fn();
const mockDeactivate = jest.fn<() => Promise<void>>();
const mockSubscribe = jest.fn(
  (destination: string, handler: (frame: MockFrame) => void) => {
    if (destination === '/user/queue/chat/rooms') {
      mockRoomUpdateHandler = handler;
    }

    return { unsubscribe: jest.fn() };
  },
);

jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation((configValue) => {
    const config = configValue as MockStompConfig;
    const client = {
      connectHeaders: {},
      subscribe: mockSubscribe,
      activate: mockActivate,
      deactivate: mockDeactivate,
    };

    mockActivate.mockImplementation(() => {
      void Promise.resolve(config.beforeConnect?.()).then(() => {
        config.onConnect?.();
      });
    });

    return client;
  }),
}));

const ACCESS_TOKEN = 'header.eyJtZW1iZXJJZCI6M30.signature';

describe('ChatUnreadProvider', () => {
  beforeEach(() => {
    mockRoomUpdateHandler = null;
    mockActivate.mockReset();
    mockDeactivate.mockReset();
    mockDeactivate.mockResolvedValue();
    mockSubscribe.mockClear();
    mockedCaptureAnalyticsEvent.mockClear();
    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'refresh-token',
    });
    window.history.replaceState(null, '', '/trade');
    server.use(
      http.get('/api/v1/members/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            name: '김민지',
            nickname: '가챠러 민지',
            profileImageUrl: null,
            desireTradeLocation: null,
          },
        }),
      ),
      http.get('/api/v1/chat/rooms/unread-count', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { unreadCount: 4 },
        }),
      ),
    );
  });

  it('초기 미읽음 수를 조회하고 개인 채팅 갱신 프레임을 배지에 반영한다', async () => {
    render(
      <BrowserRouter>
        <AuthSessionProvider>
          <ChatUnreadProvider>
            <AppHeader currentPath="/trade" />
          </ChatUnreadProvider>
        </AuthSessionProvider>
      </BrowserRouter>,
    );

    expect(
      await screen.findByRole('link', {
        name: '채팅, 읽지 않은 메시지 4개',
      }),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockRoomUpdateHandler).not.toBeNull());

    act(() => {
      mockRoomUpdateHandler?.({
        body: JSON.stringify({ totalUnreadCount: 105 }),
      });
    });

    const updatedChatLink = await screen.findByRole('link', {
      name: '채팅, 읽지 않은 메시지 105개',
    });

    expect(updatedChatLink).toHaveTextContent('99+');
    expect(mockSubscribe).toHaveBeenCalledWith(
      '/user/queue/chat/rooms',
      expect.any(Function),
    );
  });

  it('채팅 화면에서는 화면 전용 소켓과 개인 구독을 중복 연결하지 않는다', async () => {
    window.history.replaceState(null, '', '/chat');

    render(
      <BrowserRouter>
        <AuthSessionProvider>
          <ChatUnreadProvider>
            <AppHeader currentPath="/chat" />
          </ChatUnreadProvider>
        </AuthSessionProvider>
      </BrowserRouter>,
    );

    expect(
      await screen.findByRole('link', {
        name: '채팅, 읽지 않은 메시지 4개',
      }),
    ).toBeInTheDocument();
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('최초 미읽음 채팅 조회 실패를 분석 이벤트로 기록한다', async () => {
    server.use(
      http.get('/api/v1/chat/rooms/unread-count', () =>
        HttpResponse.json(
          { code: 'C500', message: '조회 실패', data: null },
          { status: 500 },
        ),
      ),
    );

    render(
      <BrowserRouter>
        <AuthSessionProvider>
          <ChatUnreadProvider>
            <AppHeader currentPath="/trade" />
          </ChatUnreadProvider>
        </AuthSessionProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
        'unread_count_initial_load_completed',
        { channel: 'chat', outcome: 'failure' },
      );
    });
  });
});
