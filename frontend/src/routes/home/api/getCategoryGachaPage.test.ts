import { describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { getCategoryGachaPage } from './getCategoryGachaPage';

describe('getCategoryGachaPage', () => {
  it('카테고리 ID로 가챠를 조회하고 백엔드가 정렬한 순서를 유지한다', async () => {
    server.use(
      http.get('/api/v1/gachas', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;

        expect(searchParams.get('categoryIds')).toBe('110');
        expect(searchParams.get('page')).toBe('0');
        expect(searchParams.get('size')).toBe('12');

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content: [
              {
                gachaId: 2,
                name: '보유 매장이 많은 가챠',
                thumbnailUrl: null,
                categories: ['산리오'],
                storeCount: 8,
              },
              {
                gachaId: 1,
                name: '보유 매장이 적은 가챠',
                thumbnailUrl: null,
                categories: ['산리오'],
                storeCount: 1,
              },
            ],
            totalElements: 2,
          },
        });
      }),
    );

    const firstPage = await getCategoryGachaPage({
      categoryId: 110,
      page: 0,
      signal: new AbortController().signal,
    });

    expect(firstPage.items.map(({ gachaId }) => gachaId)).toEqual([2, 1]);
    expect(firstPage.nextPage).toBeNull();
  });
});
