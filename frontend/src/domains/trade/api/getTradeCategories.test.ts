import { describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { getTradeCategories } from './getTradeCategories';

describe('getTradeCategories', () => {
  it('카테고리 목록 응답의 items를 반환한다', async () => {
    server.use(
      http.get('/api/v1/categories', ({ request }) => {
        expect(new URL(request.url).searchParams.get('keyword')).toBe('디지몬');

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            items: [{ categoryId: 7, name: '디지몬' }],
          },
        });
      }),
    );

    await expect(getTradeCategories('디지몬')).resolves.toEqual([
      { categoryId: 7, name: '디지몬' },
    ]);
  });
});
