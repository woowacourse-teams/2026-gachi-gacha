import { beforeEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import type { CreateTradeRequest } from '../tradeCreateType';
import { updateTrade } from './updateTrade';

const tradeRequest: CreateTradeRequest = {
  title: '쿠로미 피규어 교환해요 (수정)',
  categoryIds: [1],
  description: '상태 설명을 보강했습니다.',
};

const updatedTrade = {
  tradeId: 15,
  memberId: 3,
  title: tradeRequest.title,
  description: tradeRequest.description,
  desiredProduction: null,
  categories: ['산리오'],
  status: 'AVAILABLE',
  purchaseStore: null,
  tradePlace: null,
  availableTime: null,
  imageUrls: ['https://cdn.example.com/kuromi.png'],
  createdAt: '2026-09-30T19:00:00',
  updatedAt: '2026-09-30T20:00:00',
};

interface ReceivedTradeRequest {
  authorization: string | null;
  request: unknown;
  imageNames: string[];
}

function useUpdateTradeHandler(): { received: ReceivedTradeRequest | null } {
  const result: { received: ReceivedTradeRequest | null } = { received: null };

  server.use(
    http.put('/api/v1/trades/:tradeId', async ({ params, request }) => {
      if (params.tradeId !== '15') {
        return new HttpResponse(null, { status: 404 });
      }

      const formData = await request.formData();
      const requestPart = formData.get('request');

      if (typeof requestPart === 'string' || requestPart === null) {
        return new HttpResponse(null, { status: 400 });
      }

      result.received = {
        authorization: request.headers.get('Authorization'),
        request: JSON.parse(await requestPart.text()),
        imageNames: formData
          .getAll('images')
          .filter((image): image is File => typeof image !== 'string')
          .map((image) => image.name),
      };

      return HttpResponse.json({
        code: 'C000',
        message: '정상',
        data: updatedTrade,
      });
    }),
  );

  return result;
}

describe('updateTrade', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('새 이미지를 선택하면 request JSON과 이미지를 PUT multipart 요청으로 전송한다', async () => {
    const handler = useUpdateTradeHandler();
    const images = [
      new File(['first-image'], 'kuromi.png', { type: 'image/png' }),
      new File(['second-image'], 'cinnamoroll.jpeg', { type: 'image/jpeg' }),
    ];

    const result = await updateTrade({
      tradeId: 15,
      request: tradeRequest,
      images,
    });

    expect(handler.received).toEqual({
      authorization: 'Bearer access-token',
      request: tradeRequest,
      imageNames: ['kuromi.png', 'cinnamoroll.jpeg'],
    });
    expect(result.tradeId).toBe(15);
  });

  it('새 이미지를 선택하지 않으면 images 없이 전송해 기존 이미지를 유지한다', async () => {
    const handler = useUpdateTradeHandler();

    await updateTrade({ tradeId: 15, request: tradeRequest });

    expect(handler.received?.request).toEqual(tradeRequest);
    expect(handler.received?.imageNames).toEqual([]);
  });

  it('수정에 실패하면 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.put('/api/v1/trades/:tradeId', () =>
        HttpResponse.json(
          { code: 'T003', message: '작성자만 수정할 수 있습니다.' },
          { status: 403 },
        ),
      ),
    );

    await expect(
      updateTrade({ tradeId: 15, request: tradeRequest }),
    ).rejects.toThrow('작성자만 수정할 수 있습니다.');
  });
});
