import { describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import { createTradeComment, getTradeComments } from './tradeCommentsApi';

const TRADE_ID = 101;
const COMMENT_RESPONSE = {
  commentId: 3,
  memberId: null,
  nickname: '루챠-118.44',
  profileImageUrl: null,
  content: '교환하고 싶어요.',
  createdAt: '2026-10-15T14:30:00',
};

describe('getTradeComments', () => {
  it('등록순 댓글 목록을 공통 응답에서 꺼낸다', async () => {
    const comments = [
      { ...COMMENT_RESPONSE, commentId: 1, content: '첫 댓글' },
      { ...COMMENT_RESPONSE, commentId: 2, content: '두 번째 댓글' },
    ];

    server.use(
      http.get(`/api/v1/trades/${TRADE_ID}/comments`, () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { comments, totalCount: comments.length },
        }),
      ),
    );

    await expect(getTradeComments(TRADE_ID)).resolves.toEqual(comments);
  });

  it('댓글 수와 목록 길이가 다르면 잘못된 응답으로 처리한다', async () => {
    server.use(
      http.get(`/api/v1/trades/${TRADE_ID}/comments`, () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { comments: [COMMENT_RESPONSE], totalCount: 2 },
        }),
      ),
    );

    await expect(getTradeComments(TRADE_ID)).rejects.toThrow(
      '댓글 목록 응답 형식이 올바르지 않습니다.',
    );
  });
});

describe('createTradeComment', () => {
  it('비회원 댓글은 인증 헤더 없이 선택 닉네임과 내용을 전송한다', async () => {
    let authorizationHeader: string | null = null;
    let requestBody: unknown;

    server.use(
      http.post(`/api/v1/trades/${TRADE_ID}/comments`, async ({ request }) => {
        authorizationHeader = request.headers.get('Authorization');
        requestBody = await request.json();

        return HttpResponse.json(
          { code: 'C001', message: '생성', data: COMMENT_RESPONSE },
          { status: 201 },
        );
      }),
    );

    await expect(
      createTradeComment({
        tradeId: TRADE_ID,
        submission: { nickname: '루챠', content: '교환하고 싶어요.' },
        isAuthenticated: false,
      }),
    ).resolves.toEqual(COMMENT_RESPONSE);
    expect(authorizationHeader).toBeNull();
    expect(requestBody).toEqual({
      nickname: '루챠',
      content: '교환하고 싶어요.',
    });
  });

  it('회원 댓글은 기존 인증 요청 모듈로 액세스 토큰을 전송한다', async () => {
    let authorizationHeader: string | null = null;

    storeAuthTokens({
      accessToken: 'member-access-token',
      refreshToken: 'member-refresh-token',
    });
    server.use(
      http.post(`/api/v1/trades/${TRADE_ID}/comments`, ({ request }) => {
        authorizationHeader = request.headers.get('Authorization');

        return HttpResponse.json(
          {
            code: 'C001',
            message: '생성',
            data: {
              ...COMMENT_RESPONSE,
              memberId: 42,
              nickname: '가챠러',
            },
          },
          { status: 201 },
        );
      }),
    );

    await createTradeComment({
      tradeId: TRADE_ID,
      submission: { nickname: null, content: '회원 댓글입니다.' },
      isAuthenticated: true,
    });

    expect(authorizationHeader).toBe('Bearer member-access-token');
  });
});
