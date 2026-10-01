import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

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
