import { describe, expect, it } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { TradeDetailRoute } from './route';
import { TRADE_DETAIL } from './storybook/tradeDetailMocks';

function createAccessToken(memberId: number): string {
  const encodedPayload = btoa(JSON.stringify({ memberId }));

  return `header.${encodedPayload}.signature`;
}

function useTradeDetailHandlers() {
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
    http.get(`/api/v1/trades/${TRADE_DETAIL.tradeId}`, () =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: TRADE_DETAIL,
      }),
    ),
    http.get(`/api/v1/trades/${TRADE_DETAIL.tradeId}/comments`, () =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: { comments: [], totalCount: 0 },
      }),
    ),
    http.get('/api/v1/trades', () =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        },
      }),
    ),
  );
}

describe('TradeDetailRoute', () => {
  it('로그인한 회원이 작성자이면 수정하기 링크를 보여준다', async () => {
    useTradeDetailHandlers();

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId),
    });

    expect(
      await screen.findByRole('link', { name: '수정하기' }),
    ).toHaveAttribute('href', `/trade/${TRADE_DETAIL.tradeId}/edit`);
    expect(
      screen.queryByRole('link', { name: '채팅하기' }),
    ).not.toBeInTheDocument();
  });

  it('비로그인 사용자의 채팅하기는 로그인 후 상세 페이지로 돌아오는 로그인 링크다', async () => {
    useTradeDetailHandlers();

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: null,
    });

    expect(
      await screen.findByRole('link', { name: '채팅하기' }),
    ).toHaveAttribute(
      'href',
      `/login?returnTo=${encodeURIComponent(`/trade/${TRADE_DETAIL.tradeId}`)}`,
    );
  });

  it('로그인한 회원이 작성자가 아니면 채팅하기 링크를 보여준다', async () => {
    useTradeDetailHandlers();

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId + 1),
    });

    expect(
      await screen.findByRole('link', { name: '채팅하기' }),
    ).toHaveAttribute('href', `/chat/start/${TRADE_DETAIL.tradeId}`);
    expect(
      screen.queryByRole('link', { name: '수정하기' }),
    ).not.toBeInTheDocument();
  });

  it('서버가 제공한 등록순으로 회원·비회원 댓글을 표시한다', async () => {
    useTradeDetailHandlers();
    server.use(
      http.get(`/api/v1/trades/${TRADE_DETAIL.tradeId}/comments`, () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            comments: [
              {
                commentId: 1,
                memberId: null,
                nickname: '루챠-118.44',
                profileImageUrl: null,
                content: '먼저 작성한 댓글',
                createdAt: '2026-10-15T10:00:00',
              },
              {
                commentId: 2,
                memberId: TRADE_DETAIL.memberId,
                nickname: '가챠러 민지',
                profileImageUrl: null,
                content: '나중에 작성한 댓글',
                createdAt: '2026-10-15T10:01:00',
              },
            ],
            totalCount: 2,
          },
        }),
      ),
    );

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: null,
    });

    const commentList = await screen.findByRole('region', {
      name: '댓글 목록',
    });
    const commentArticles = within(commentList).getAllByRole('article');

    expect(
      within(commentArticles[0]!).getByText('먼저 작성한 댓글'),
    ).toBeInTheDocument();
    expect(
      within(commentArticles[1]!).getByText('나중에 작성한 댓글'),
    ).toBeInTheDocument();
    expect(within(commentArticles[1]!).getByText('작성자')).toBeInTheDocument();
  });

  it('비회원 댓글을 등록하고 서버가 만든 IP 포함 표시명을 바로 보여준다', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;

    useTradeDetailHandlers();
    server.use(
      http.post(
        `/api/v1/trades/${TRADE_DETAIL.tradeId}/comments`,
        async ({ request }) => {
          requestBody = await request.json();

          return HttpResponse.json(
            {
              code: 'C001',
              message: '생성',
              data: {
                commentId: 1,
                memberId: null,
                nickname: '홍길동-118.44',
                profileImageUrl: null,
                content: '교환하고 싶어요.',
                createdAt: '2026-10-15T10:00:00',
              },
            },
            { status: 201 },
          );
        },
      ),
    );

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: null,
    });

    await screen.findByRole('heading', { name: '아직 댓글이 없어요' });
    await user.type(
      screen.getByRole('textbox', { name: '비회원 닉네임' }),
      '홍길동',
    );
    await user.type(
      screen.getByRole('textbox', { name: '댓글 내용' }),
      '교환하고 싶어요.',
    );
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(await screen.findByText('홍길동-118.44')).toBeInTheDocument();
    expect(screen.getByText('교환하고 싶어요.')).toBeInTheDocument();
    expect(requestBody).toEqual({
      nickname: '홍길동',
      content: '교환하고 싶어요.',
    });
  });
});

describe('TradeDetailRoute 삭제', () => {
  it('작성자가 삭제를 확인하면 DELETE 요청 후 교환 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    let deleteRequestCount = 0;

    useTradeDetailHandlers();
    server.use(
      http.delete(`/api/v1/trades/${TRADE_DETAIL.tradeId}`, () => {
        deleteRequestCount += 1;

        return HttpResponse.json({ code: 'C003', message: '정상 삭제' });
      }),
    );
    storeAuthTokens({
      accessToken: createAccessToken(TRADE_DETAIL.memberId),
      refreshToken: 'refresh-token',
    });

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId),
      route: `/trade/${TRADE_DETAIL.tradeId}`,
    });

    await user.click(await screen.findByRole('button', { name: '삭제' }));

    const dialog = screen.getByRole('alertdialog', {
      name: '교환 글을 삭제할까요?',
    });

    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/trade');
    });
    expect(deleteRequestCount).toBe(1);
  });

  it('취소하면 삭제 요청 없이 확인 창만 닫는다', async () => {
    const user = userEvent.setup();
    let deleteRequestCount = 0;

    useTradeDetailHandlers();
    server.use(
      http.delete(`/api/v1/trades/${TRADE_DETAIL.tradeId}`, () => {
        deleteRequestCount += 1;

        return HttpResponse.json({ code: 'C003', message: '정상 삭제' });
      }),
    );

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId),
      route: `/trade/${TRADE_DETAIL.tradeId}`,
    });

    await user.click(await screen.findByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(deleteRequestCount).toBe(0);
  });

  it('작성자가 아니면 삭제 버튼을 보여주지 않는다', async () => {
    useTradeDetailHandlers();

    renderWithProviders(<TradeDetailRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId + 1),
    });

    await screen.findByRole('link', { name: '채팅하기' });

    expect(
      screen.queryByRole('button', { name: '삭제' }),
    ).not.toBeInTheDocument();
  });
});
