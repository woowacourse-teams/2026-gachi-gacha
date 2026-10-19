import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';

import type { ChatMessage, ChatRoomUpdate } from '@/domains/chat/chatType';
import { compressChatImages } from '@/domains/chat/compressChatImages';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { chatHandlers } from './mocks/chatHandlers';
import { ChatRoute, ChatStartRoute } from './route';

let mockOnMessage: ((message: ChatMessage) => void) | null = null;
let mockOnRoomUpdate: ((update: ChatRoomUpdate) => void) | null = null;
const mockSendImageMessage =
  jest.fn<(content: string, files: ChatMessage['files']) => Promise<void>>();

jest.mock('@/domains/chat/compressChatImages', () => ({
  compressChatImages: jest.fn(),
}));

const mockedCompressChatImages = jest.mocked(compressChatImages);

jest.mock('@/domains/chat/useChatSocket', () => ({
  useChatSocket: ({
    onMessage,
    onRoomUpdate,
  }: {
    onMessage: (message: ChatMessage) => void;
    onRoomUpdate: (update: ChatRoomUpdate) => void;
  }) => {
    mockOnMessage = onMessage;
    mockOnRoomUpdate = onRoomUpdate;

    return {
      status: 'connected',
      errorMessage: null,
      sendTextMessage: async () => undefined,
      sendImageMessage: mockSendImageMessage,
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
    files: [],
    createdAt: '2026-10-01T10:00:00',
  };
}

const ACCESS_TOKEN = 'header.eyJtZW1iZXJJZCI6M30.signature';

function createTradeDetail(
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' = 'AVAILABLE',
  memberId = 3,
) {
  return {
    tradeId: 1,
    memberId,
    title: '쿠로미 미니 피규어 vol.2',
    description: '교환할 가챠를 찾고 있어요.',
    desiredProduction: null,
    categories: [],
    status,
    purchaseStore: null,
    tradePlace: null,
    availableTime: null,
    imageUrls: [],
    createdAt: '2026-10-01T09:00:00',
    updatedAt: '2026-10-01T09:00:00',
  };
}

describe('ChatRoute', () => {
  beforeEach(() => {
    mockOnMessage = null;
    mockOnRoomUpdate = null;
    mockSendImageMessage.mockReset();
    mockSendImageMessage.mockResolvedValue();
    mockedCompressChatImages.mockReset();
    mockedCompressChatImages.mockImplementation(async (files) => files);
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
      http.get('/api/v1/trades/:tradeId', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: createTradeDetail(),
        }),
      ),
      ...chatHandlers,
    );
  });

  it('선택한 사진을 업로드한 뒤 이미지 메시지 메타데이터를 전송한다', async () => {
    const user = userEvent.setup();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:chat-preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    const image = new File(['image'], 'offer.jpg', { type: 'image/jpeg' });
    await user.upload(await screen.findByLabelText('사진 추가'), image);
    await user.type(
      screen.getByRole('textbox', { name: '메시지' }),
      '교환 사진',
    );
    await user.click(screen.getByRole('button', { name: '보내기' }));

    await waitFor(() => {
      expect(mockSendImageMessage).toHaveBeenCalledWith('교환 사진', [
        expect.objectContaining({
          originalName: 'offer.jpg',
          contentType: 'image/jpeg',
        }),
      ]);
    });
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

  it('첫 메시지가 없는 방은 숨기고 첫 메시지 갱신 후 목록에 보여준다', async () => {
    const emptyRoom = {
      roomId: 3,
      trade: {
        tradeId: 3,
        memberId: 4,
        title: '아직 대화하지 않은 교환글',
        status: 'AVAILABLE' as const,
        thumbnailUrl: null,
      },
      otherMember: {
        memberId: 4,
        nickname: '빈방상대',
        profileImageUrl: null,
      },
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2026-10-01T10:00:00',
    };

    server.use(
      http.get('/api/v1/chat/rooms/me', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            rooms: [emptyRoom],
          },
        }),
      ),
    );

    renderWithProviders(<ChatRoute />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat',
    });

    expect(
      await screen.findByText('아직 시작한 대화가 없어요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /빈방상대/ }),
    ).not.toBeInTheDocument();

    act(() => {
      mockOnRoomUpdate?.({
        room: {
          ...emptyRoom,
          lastMessage: {
            preview: '첫 교환 문의예요.',
            sentAt: '2026-10-01T10:01:00',
          },
          unreadCount: 1,
        },
        totalUnreadCount: 1,
      });
    });

    expect(
      await screen.findByRole('button', { name: /빈방상대/ }),
    ).toHaveTextContent('첫 교환 문의예요.');
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

  it('작성자가 채팅방에서 예약 확정 후 거래 완료로 상태를 변경한다', async () => {
    const user = userEvent.setup();
    const requestedStatuses: string[] = [];

    server.use(
      http.patch('/api/v1/trades/1/status', async ({ request }) => {
        const body = (await request.json()) as { status: string };

        requestedStatuses.push(body.status);

        return HttpResponse.json({
          code: 'C002',
          message: '정상 수정',
          data: createTradeDetail(body.status as 'IN_PROGRESS' | 'COMPLETED'),
        });
      }),
    );

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    await user.click(await screen.findByRole('button', { name: '예약 확정' }));
    expect(
      await screen.findByRole('button', { name: '거래 완료' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '거래 완료' }));

    await waitFor(() => {
      expect(requestedStatuses).toEqual(['IN_PROGRESS', 'COMPLETED']);
    });
    expect(
      screen.queryByRole('button', { name: '거래 완료' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('교환 완료').length).toBeGreaterThan(0);
  });

  it('구매자에게는 상태 변경 버튼을 보여주지 않는다', async () => {
    server.use(
      http.get('/api/v1/trades/1', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: createTradeDetail('AVAILABLE', 8),
        }),
      ),
    );

    renderWithProviders(<ChatRoute roomId={1} />, {
      initialAccessToken: ACCESS_TOKEN,
      route: '/chat/1',
    });

    expect(
      await screen.findByRole('heading', { name: '가챠좋아' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '예약 확정' }),
    ).not.toBeInTheDocument();
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
    );
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
