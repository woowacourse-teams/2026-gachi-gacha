import { describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import type { CreateTradeRequest } from '../tradeCreateType';
import { createTrade } from './createTrade';

const tradeRequest: CreateTradeRequest = {
  title: '쿠로미 피규어 교환해요',
  categoryIds: [1, 2],
  description: '개봉만 한 상품입니다.',
  desiredProduction: '시나모롤 키링',
  tradePlace: {
    name: '홍대입구역 8번 출구',
    address: '서울특별시 마포구 양화로 160',
    latitude: 37.557,
    longitude: 126.9245,
  },
  availableTime: '2026-09-30T19:00:00',
};

describe('createTrade', () => {
  it('request JSON과 이미지를 하나의 multipart 요청으로 전송한다', async () => {
    let authorization: string | null = null;
    let contentType: string | null = null;
    let receivedRequest: unknown = null;
    let receivedImageNames: string[] = [];

    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    server.use(
      http.post('/api/v1/trades', async ({ request }) => {
        authorization = request.headers.get('Authorization');
        contentType = request.headers.get('Content-Type');

        const formData = await request.formData();
        const requestPart = formData.get('request');

        if (typeof requestPart === 'string' || requestPart === null) {
          return new HttpResponse(null, { status: 400 });
        }

        receivedRequest = JSON.parse(await requestPart.text());
        receivedImageNames = formData
          .getAll('images')
          .filter((image): image is File => typeof image !== 'string')
          .map((image) => image.name);

        return HttpResponse.json(
          {
            code: 'C001',
            message: '정상 생성',
            data: {
              tradeId: 15,
              memberId: 3,
              title: tradeRequest.title,
              description: tradeRequest.description,
              desiredProduction: tradeRequest.desiredProduction,
              categories: ['피규어', '산리오'],
              status: 'AVAILABLE',
              purchaseStore: null,
              tradePlace: tradeRequest.tradePlace,
              availableTime: tradeRequest.availableTime,
              imageUrls: ['https://cdn.example.com/kuromi.png'],
              createdAt: '2026-09-30T19:00:00',
              updatedAt: '2026-09-30T19:00:00',
            },
          },
          { status: 201 },
        );
      }),
    );
    const images = [
      new File(['first-image'], 'kuromi.png', { type: 'image/png' }),
      new File(['second-image'], 'cinnamoroll.jpeg', { type: 'image/jpeg' }),
    ];

    const result = await createTrade({ request: tradeRequest, images });

    expect(authorization).toBe('Bearer access-token');
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(receivedRequest).toEqual(tradeRequest);
    expect(receivedImageNames).toEqual(['kuromi.png', 'cinnamoroll.jpeg']);
    expect(result.tradeId).toBe(15);
  });
});
