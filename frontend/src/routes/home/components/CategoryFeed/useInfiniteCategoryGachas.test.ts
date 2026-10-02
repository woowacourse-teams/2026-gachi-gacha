import { describe, expect, it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { useInfiniteCategoryGachas } from './useInfiniteCategoryGachas';

function createGacha(gachaId: number) {
  return {
    gachaId,
    name: `산리오 가챠 ${gachaId}`,
    thumbnailUrl: null,
    categories: ['산리오'],
    storeCount: 20 - gachaId,
  };
}

describe('useInfiniteCategoryGachas', () => {
  it('카테고리 ID는 한 번만 조회하고 다음 페이지에도 재사용한다', async () => {
    let categoryRequestCount = 0;
    const requestedPages: number[] = [];

    server.use(
      http.get('/api/v1/categories', () => {
        categoryRequestCount += 1;

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
      http.get('/api/v1/gachas', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const page = Number(searchParams.get('page'));

        expect(searchParams.get('categoryIds')).toBe('110');
        requestedPages.push(page);

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content:
              page === 0
                ? Array.from({ length: 12 }, (_, index) =>
                    createGacha(index + 1),
                  )
                : [createGacha(13)],
            totalElements: 13,
          },
        });
      }),
    );

    const { result } = renderHook(() => useInfiniteCategoryGachas('산리오'));

    await waitFor(() => {
      expect(result.current.itemsState.status).toBe('success');
      expect(result.current.hasNextPage).toBe(true);
    });

    act(() => {
      result.current.loadNextPage();
    });

    await waitFor(() => {
      expect(result.current.itemsState.status).toBe('success');

      if (result.current.itemsState.status === 'success') {
        expect(result.current.itemsState.data).toHaveLength(13);
      }

      expect(result.current.hasNextPage).toBe(false);
    });

    expect(categoryRequestCount).toBe(1);
    expect(requestedPages).toEqual([0, 1]);
  });
});
