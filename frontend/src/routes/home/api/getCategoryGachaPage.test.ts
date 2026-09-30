import { describe, expect, it } from '@jest/globals';

import { server } from '@/test/server';

import { getCategoryGachaPage } from './getCategoryGachaPage';
import { homeHandlers } from '../mocks/homeHandlers';

describe('getCategoryGachaPage', () => {
  it('카테고리에 해당하는 가챠를 페이지 단위로 조회한다', async () => {
    server.use(...homeHandlers);

    const firstPage = await getCategoryGachaPage({
      categoryName: '산리오',
      page: 0,
      signal: new AbortController().signal,
    });
    const secondPage = await getCategoryGachaPage({
      categoryName: '산리오',
      page: 1,
      signal: new AbortController().signal,
    });

    expect(firstPage.items).toHaveLength(12);
    expect(firstPage.nextPage).toBe(1);
    expect(secondPage.items).toHaveLength(3);
    expect(secondPage.nextPage).toBeNull();
  });
});
