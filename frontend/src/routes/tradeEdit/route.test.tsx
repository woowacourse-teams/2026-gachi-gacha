import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { TradeEditRoute } from './route';
import { TRADE_DETAIL } from '../tradeDetail/storybook/tradeDetailMocks';

function createAccessToken(memberId: number): string {
  return `header.${btoa(JSON.stringify({ memberId }))}.signature`;
}

function useEditHandlers() {
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
        data: {
          ...TRADE_DETAIL,
          imageUrls: ['https://cdn.example.com/trade.jpg'],
        },
      }),
    ),
    http.get('/api/v1/categories', () =>
      HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: [
          { categoryId: 1, name: '산리오' },
          { categoryId: 2, name: '피규어' },
          { categoryId: 3, name: '키링' },
        ],
      }),
    ),
  );
}

describe('TradeEditRoute', () => {
  it('작성자에게 기존 게시글과 카테고리를 채운 수정 폼을 보여준다', async () => {
    useEditHandlers();

    renderWithProviders(<TradeEditRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId),
      route: `/trade/${TRADE_DETAIL.tradeId}/edit`,
    });

    expect(
      await screen.findByRole('heading', { name: '교환 글 수정' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue(
      TRADE_DETAIL.title,
    );
    expect(screen.getByRole('textbox', { name: /설명/ })).toHaveValue(
      TRADE_DETAIL.description,
    );
    expect(screen.getByRole('textbox', { name: '교환 희망 상품' })).toHaveValue(
      TRADE_DETAIL.desiredProduction,
    );
    expect(
      screen.getByRole('button', { name: '산리오 카테고리 선택 해제' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '피규어 카테고리 선택 해제' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '구매 매장' })).toHaveTextContent(
      '가챠샵 홍대점',
    );
    expect(screen.getByRole('button', { name: '교환 장소' })).toHaveTextContent(
      '홍대입구역 8번 출구',
    );
    expect(
      screen.getByRole('img', { name: '기존 교환 사진 1' }),
    ).toHaveAttribute('src', 'https://cdn.example.com/trade.jpg');
    expect(screen.getByRole('button', { name: '수정하기' })).toBeDisabled();
  });

  it('작성자가 아니면 수정 폼 접근을 차단한다', async () => {
    useEditHandlers();

    renderWithProviders(<TradeEditRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId + 1),
      route: `/trade/${TRADE_DETAIL.tradeId}/edit`,
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '작성자만 교환 게시글을 수정할 수 있습니다.',
    );
    expect(
      screen.queryByRole('heading', { name: '교환 글 수정' }),
    ).not.toBeInTheDocument();
  });
});
