import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { chatHandlers } from './mocks/chatHandlers';
import { ChatRoute } from './route';

jest.mock('@/domains/chat/useChatSocket', () => ({
  useChatSocket: () => ({
    status: 'connected',
    errorMessage: null,
    sendTextMessage: async () => undefined,
  }),
}));

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
