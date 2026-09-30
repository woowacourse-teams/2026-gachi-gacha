import { describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
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
        data: {
          items: [
            { categoryId: 1, name: '산리오' },
            { categoryId: 2, name: '피규어' },
            { categoryId: 3, name: '키링' },
          ],
        },
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
    expect(screen.getByRole('button', { name: '수정하기' })).toBeEnabled();
  });

  it('새 사진 없이 저장하면 images 없이 PUT 요청하고 상세 페이지로 이동한다', async () => {
    const user = userEvent.setup();
    let receivedRequest: unknown = null;
    let receivedImageCount = -1;

    useEditHandlers();
    server.use(
      http.put(
        `/api/v1/trades/${TRADE_DETAIL.tradeId}`,
        async ({ request }) => {
          const formData = await request.formData();
          const requestPart = formData.get('request');

          if (typeof requestPart === 'string' || requestPart === null) {
            return new HttpResponse(null, { status: 400 });
          }

          receivedRequest = JSON.parse(await requestPart.text());
          receivedImageCount = formData.getAll('images').length;

          return HttpResponse.json({
            code: 'C000',
            message: '정상',
            data: { ...TRADE_DETAIL, title: '수정한 제목' },
          });
        },
      ),
    );
    storeAuthTokens({
      accessToken: createAccessToken(TRADE_DETAIL.memberId),
      refreshToken: 'refresh-token',
    });

    renderWithProviders(<TradeEditRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId),
      route: `/trade/${TRADE_DETAIL.tradeId}/edit`,
    });

    const titleInput = await screen.findByRole('textbox', { name: /제목/ });

    await user.clear(titleInput);
    await user.type(titleInput, '수정한 제목');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/trade/${TRADE_DETAIL.tradeId}`);
    });
    expect(receivedRequest).toMatchObject({
      title: '수정한 제목',
      categoryIds: [2, 1],
    });
    expect(receivedImageCount).toBe(0);
  });

  it('수정에 실패하면 에러 메시지를 보여주고 수정 페이지에 머문다', async () => {
    const user = userEvent.setup();

    useEditHandlers();
    server.use(
      http.put(`/api/v1/trades/${TRADE_DETAIL.tradeId}`, () =>
        HttpResponse.json(
          { code: 'T003', message: '교환 게시글을 수정하지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );
    storeAuthTokens({
      accessToken: createAccessToken(TRADE_DETAIL.memberId),
      refreshToken: 'refresh-token',
    });

    renderWithProviders(<TradeEditRoute tradeId={TRADE_DETAIL.tradeId} />, {
      initialAccessToken: createAccessToken(TRADE_DETAIL.memberId),
      route: `/trade/${TRADE_DETAIL.tradeId}/edit`,
    });

    await user.click(await screen.findByRole('button', { name: '수정하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '교환 게시글을 수정하지 못했습니다.',
    );
    expect(window.location.pathname).toBe(
      `/trade/${TRADE_DETAIL.tradeId}/edit`,
    );
    expect(screen.getByRole('button', { name: '수정하기' })).toBeEnabled();
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
