import { http, HttpResponse } from 'msw';

export const MOCK_AUTH_TOKENS = {
  accessToken: 'mock.eyJtZW1iZXJJZCI6M30.mock',
  refreshToken: 'mock-refresh-token',
};

export const mockAuthHandlers = [
  http.get('/api/v1/members/me', () =>
    HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        oauthUsername: 'msw-user',
        nickname: 'MSW 가챠러',
        profileImageUrl: null,
        desireTradeLocation: '홍대입구역',
      },
    }),
  ),
];
