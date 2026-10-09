import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';

import type {
  ChatMessage,
  ChatRoomUpdate,
  ChatTradeAction,
} from '@/domains/chat/chatType';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { chatHandlers } from './mocks/chatHandlers';
import { ChatRoute, ChatStartRoute } from './route';

let mockOnMessage: ((message: ChatMessage) => void) | null = null;
let mockOnRoomUpdated: ((update: ChatRoomUpdate) => void) | null = null;

jest.mock('@/domains/chat/useChatSocket', () => ({
  useChatSocket: ({
    onMessage,
    onRoomUpdated,
  }: {
    onMessage: (message: ChatMessage) => void;
    onRoomUpdated?: (update: ChatRoomUpdate) => void;
  }) => {
    mockOnMessage = onMessage;
    mockOnRoomUpdated = onRoomUpdated ?? null;

    return {
      status: 'connected',
      errorMessage: null,
      sendTextMessage: async () => undefined,
    };
  },
}));

function createSocketMessage(sequence: number, senderId: number): ChatMessage {
  return {
    messageId: `socket-message-${sequence}`,
    sequence,
    roomId: 1,
    senderId,
    type: 'TEXT',
    content: `실시간 메시지 ${sequence}`,
    createdAt: '2026-10-01T10:00:00',
  };
}

const ACCESS_TOKEN = 'header.eyJtZW1iZXJJZCI6M30.signature';

describe('ChatRoute', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'refresh-token',
    });
    server.use(
      http.get('/api/v1/members/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            oauthUsername: 'msw-user',
            nickname: 'MSW 가챠러',
            profileImageUrl: null,
            desireTradeLocation: null,
          },
        }),
      ),
      ...chatHandlers,
    );
  });

  it('열린 채팅방에서 상대 메시지를 받으면 마지막 sequence까지 서버에 읽음 처리한다', async () => {
    const readSequences: number[] = [];

    server.use(
      http.patch(
        '/api/v1/chat/rooms/:roomId/messages/read',
        async ({ request }) => {
          const body = (await request.json()) as { lastReadSequence: number };

          readSequences.push(body.lastReadSequence);

          return HttpResponse.json({ code: 'C000', message: '정상' });
        },
      ),
    );

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    await waitFor(() => {
      expect(readSequences).toEqual([22]);
    });

    act(() => {
      mockOnMessage?.(createSocketMessage(23, 8));
      mockOnMessage?.(createSocketMessage(24, 8));
      // 내가 보낸 메시지는 읽음 처리 대상이 아니다.
      mockOnMessage?.(createSocketMessage(25, 3));
    });

    expect(await screen.findByText('실시간 메시지 24')).toBeInTheDocument();
    await waitFor(() => {
      expect(readSequences).toEqual([22, 24]);
    });
  });

  it('목록의 채팅을 선택해도 /chat 주소를 유지하고 내부 패널만 보여준다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ChatRoute />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat',
    });

    await user.click(await screen.findByRole('button', { name: /가챠좋아/ }));

    expect(
      await screen.findByRole('heading', { name: '가챠좋아' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/chat');
    expect(
      screen.queryByRole('complementary', {
        name: '가챠좋아님과의 채팅 페이지',
      }),
    ).not.toBeInTheDocument();
  });

  it('버튼을 누르면 이전 메시지를 기존 대화 앞에 추가한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    await user.click(
      await screen.findByRole('button', {
        name: '이전 메시지 불러오기',
      }),
    );

    expect(
      await screen.findByText('어제 올리신 교환 글 보고 연락드려요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: '이전 메시지 불러오기',
      }),
    ).not.toBeInTheDocument();
  });

  it('글 작성자가 예약을 확정하면 현재 방만 예약된 진행 중 상태로 갱신한다', async () => {
    const user = userEvent.setup();
    let status = 'AVAILABLE' as 'AVAILABLE' | 'IN_PROGRESS';
    let availableAction: ChatTradeAction | null = 'CONFIRM_RESERVATION';
    let reservationRequestCount = 0;
    const createRoom = () => ({
      roomId: 1,
      trade: {
        tradeId: 1,
        title: '쿠로미 미니 피규어 vol.2',
        status,
        thumbnailUrl: null,
        availableAction,
      },
      otherMember: {
        memberId: 8,
        nickname: '가챠좋아',
        profileImageUrl: null,
      },
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2026-10-01T09:00:00',
    });

    server.use(
      http.get('/api/v1/chat/rooms/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { rooms: [createRoom()] },
        }),
      ),
      http.get('/api/v1/chat/rooms/1', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: createRoom(),
        }),
      ),
      http.patch('/api/v1/chat/rooms/1/trade', () => {
        reservationRequestCount += 1;
        status = 'IN_PROGRESS';
        availableAction = 'CANCEL_RESERVATION';

        return HttpResponse.json({
          code: 'C002',
          message: '정상 수정',
          data: createRoom(),
        });
      }),
    );

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    await user.click(await screen.findByRole('button', { name: '예약확정' }));

    expect(reservationRequestCount).toBe(1);
    expect(
      await screen.findByRole('button', { name: '예약취소' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('교환 진행 중').length).toBeGreaterThan(0);
  });

  it('예약 경합에 실패하면 서버 메시지를 표시한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.patch('/api/v1/chat/rooms/1/trade', () =>
        HttpResponse.json(
          { code: 'T009', message: '다른 채팅방에서 이미 예약됐습니다.' },
          { status: 409 },
        ),
      ),
    );

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    await user.click(await screen.findByRole('button', { name: '예약확정' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '다른 채팅방에서 이미 예약됐습니다.',
    );
  });

  it('개인 채팅방 갱신 이벤트를 받으면 예약 액션과 상태를 즉시 바꾼다', async () => {
    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    expect(
      await screen.findByRole('button', { name: '예약확정' }),
    ).toBeInTheDocument();

    act(() => {
      mockOnRoomUpdated?.({
        room: {
          roomId: 1,
          trade: {
            tradeId: 1,
            title: '쿠로미 미니 피규어 vol.2',
            status: 'IN_PROGRESS',
            thumbnailUrl: null,
            availableAction: 'CANCEL_RESERVATION',
          },
          otherMember: {
            memberId: 8,
            nickname: '가챠좋아',
            profileImageUrl: null,
          },
          lastMessage: null,
          unreadCount: 0,
          createdAt: '2026-10-01T09:00:00',
        },
        totalUnreadCount: 0,
      });
    });

    expect(
      await screen.findByRole('button', { name: '예약취소' }),
    ).toBeInTheDocument();
  });

  it('창에 다시 포커스하면 서버 상태를 재조회해 WebSocket 갱신 누락을 보완한다', async () => {
    let status = 'AVAILABLE' as 'AVAILABLE' | 'IN_PROGRESS';
    let availableAction: ChatTradeAction | null = 'CONFIRM_RESERVATION';
    const createRoom = () => ({
      roomId: 1,
      trade: {
        tradeId: 1,
        title: '쿠로미 미니 피규어 vol.2',
        status,
        thumbnailUrl: null,
        availableAction,
      },
      otherMember: {
        memberId: 8,
        nickname: '가챠좋아',
        profileImageUrl: null,
      },
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2026-10-01T09:00:00',
    });

    server.use(
      http.get('/api/v1/chat/rooms/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { rooms: [createRoom()] },
        }),
      ),
      http.get('/api/v1/chat/rooms/1', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: createRoom(),
        }),
      ),
    );

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    expect(
      await screen.findByRole('button', { name: '예약확정' }),
    ).toBeInTheDocument();

    status = 'IN_PROGRESS';
    availableAction = 'CANCEL_RESERVATION';
    act(() => window.dispatchEvent(new Event('focus')));

    expect(
      await screen.findByRole('button', { name: '예약취소' }),
    ).toBeInTheDocument();
  });
});

describe('ChatStartRoute', () => {
  // 앱처럼 입장 후 /chat/:roomId로 이동하면 시작 화면이 사라지도록 라우트로 감쌉니다.
  function renderChatStartRoutes({ modal = false }: { modal?: boolean } = {}) {
    return (
      <Routes>
        <Route
          path="/chat/start/:tradeId"
          element={<ChatStartRoute tradeId={15} modal={modal} />}
        />
        <Route path="/chat/:roomId" element={<p>채팅방 화면</p>} />
      </Routes>
    );
  }

  function useFlakyExistenceHandler() {
    let requestCount = 0;

    server.use(
      http.get('/api/v1/chat/rooms/existence', () => {
        requestCount += 1;

        if (requestCount === 1) {
          return HttpResponse.json(
            { code: 'S001', message: '일시적인 오류가 발생했습니다.' },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { isExist: true, roomId: 1 },
        });
      }),
    );

    return () => requestCount;
  }

  beforeEach(() => {
    storeAuthTokens({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'refresh-token',
    });
  });

  it('입장에 실패하면 다시 시도로 기존 채팅방 조회부터 다시 실행한다', async () => {
    const user = userEvent.setup();
    const getRequestCount = useFlakyExistenceHandler();

    renderWithProviders(renderChatStartRoutes(), {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/start/15',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '채팅방에 입장하지 못했어요',
    );
    expect(
      screen.getByRole('link', { name: '게시글로 돌아가기' }),
    ).toHaveAttribute('href', '/trade/15');

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/chat/1');
    });
    expect(getRequestCount()).toBe(2);
  });

  it('모달에서도 입장 실패 시 다시 시도와 게시글로 돌아가기를 제공한다', async () => {
    const user = userEvent.setup();
    const getRequestCount = useFlakyExistenceHandler();

    renderWithProviders(renderChatStartRoutes({ modal: true }), {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/start/15',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '채팅방에 입장하지 못했어요',
    );
    expect(
      screen.getByRole('button', { name: '게시글로 돌아가기' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/chat/1');
    });
    expect(getRequestCount()).toBe(2);
  });
});
