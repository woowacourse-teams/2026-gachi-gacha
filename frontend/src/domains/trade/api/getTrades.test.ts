import { describe, expect, it } from '@jest/globals';

import { createTradesUrl } from './getTrades';

describe('교환 게시글 목록 URL', () => {
  it('검색어·카테고리·상태·정렬 조건을 함께 직렬화한다', () => {
    const url = new URL(
      createTradesUrl({
        keyword: '  쿠로미  ',
        categoryIds: [11, 25],
        status: 'AVAILABLE',
        page: 2,
        size: 12,
        sort: 'createdAt,asc',
      }),
      'https://gachigacha.test',
    );

    expect(url.pathname).toBe('/api/v1/trades');
    expect(url.searchParams.get('keyword')).toBe('쿠로미');
    expect(url.searchParams.get('categoryIds')).toBe('11,25');
    expect(url.searchParams.get('status')).toBe('AVAILABLE');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('size')).toBe('12');
    expect(url.searchParams.get('sort')).toBe('createdAt,asc');
  });
});
