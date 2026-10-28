import { describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { getCategoryIdByExactName } from './getCategoryIdByExactName';

describe('getCategoryIdByExactName', () => {
  it('부분 일치 결과 중 이름이 정확히 같은 카테고리의 식별자를 선택한다', async () => {
    const requestedKeyword = jest.fn<(keyword: string | null) => void>();

    server.use(
      http.get('/api/v1/categories', ({ request }) => {
        requestedKeyword(new URL(request.url).searchParams.get('keyword'));

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            items: [
              { categoryId: 324, name: '산리오 캐릭터즈' },
              { categoryId: 110, name: '산리오' },
            ],
          },
        });
      }),
    );

    await expect(getCategoryIdByExactName(' 산리오 ')).resolves.toBe(110);
    expect(requestedKeyword).toHaveBeenCalledWith('산리오');
  });

  it('정확히 같은 카테고리가 없으면 null을 반환한다', async () => {
    server.use(
      http.get('/api/v1/categories', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            items: [{ categoryId: 324, name: '산리오 캐릭터즈' }],
          },
        }),
      ),
    );

    await expect(getCategoryIdByExactName('산리오')).resolves.toBeNull();
  });
});
