import { beforeEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import { updateTradeStatus } from './updateTradeStatus';

const TRADE_DETAIL = {
  tradeId: 15,
  memberId: 7,
  title: '쿠로미 피규어 교환해요',
  description: null,
  desiredProduction: null,
  categories: ['피규어'],
  status: 'COMPLETED',
  purchaseStore: null,
  tradePlace: null,
  availableTime: null,
  imageUrls: [],
  createdAt: '2026-09-29T14:30:00',
  updatedAt: '2026-10-06T16:30:00',
} as const;

describe('updateTradeStatus', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('인증 헤더와 변경할 상태를 PATCH 요청으로 전송한다', async () => {
    let authorization: string | null = null;
    let requestBody: unknown = null;

    server.use(
      http.patch('/api/v1/trades/15/status', async ({ request }) => {
        authorization = request.headers.get('Authorization');
        requestBody = await request.json();

        return HttpResponse.json({
          code: 'C002',
          message: '정상 수정',
          data: TRADE_DETAIL,
        });
      }),
    );

    await expect(
      updateTradeStatus({ tradeId: 15, status: 'COMPLETED' }),
    ).resolves.toEqual(TRADE_DETAIL);
    expect(authorization).toBe('Bearer access-token');
    expect(requestBody).toEqual({ status: 'COMPLETED' });
  });

  it('실패하면 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.patch('/api/v1/trades/15/status', () =>
        HttpResponse.json(
          { code: 'T003', message: '작성자만 상태를 변경할 수 있습니다.' },
          { status: 403 },
        ),
      ),
    );

    await expect(
      updateTradeStatus({ tradeId: 15, status: 'COMPLETED' }),
    ).rejects.toThrow('작성자만 상태를 변경할 수 있습니다.');
  });
});
