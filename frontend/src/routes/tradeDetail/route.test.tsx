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
