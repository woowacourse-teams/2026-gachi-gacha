import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type { ChatMessage } from '@/domains/chat/chatType';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { chatHandlers } from './mocks/chatHandlers';
import { ChatRoute } from './route';

let mockOnMessage: ((message: ChatMessage) => void) | null = null;

jest.mock('@/domains/chat/useChatSocket', () => ({
  useChatSocket: ({
    onMessage,
  }: {
    onMessage: (message: ChatMessage) => void;
  }) => {
    mockOnMessage = onMessage;

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
});
