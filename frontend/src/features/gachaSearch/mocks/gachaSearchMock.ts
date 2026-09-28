import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { gachaProductsMock } from '@/domains/product/mocks/gachaProductsMock';
import type { ApiResponse } from '@/shared/api/apiResponseType';

import type { GachaSearchParams } from '../api/gachaSearchParamsType';

interface GachaSearchPageMockData {
  content: readonly GachaProductSummary[];
  totalElements: number;
}

export function createGachaSearchMockResponse({
  keyword,
  page,
  size,
}: GachaSearchParams): ApiResponse<GachaSearchPageMockData> {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('ko-KR');
  const filteredProducts = gachaProductsMock.filter((product) =>
    product.name.toLocaleLowerCase('ko-KR').includes(normalizedKeyword),
  );
  const pageStart = page * size;

  return {
    code: 'C000',
    message: '정상',
    data: {
      content: filteredProducts.slice(pageStart, pageStart + size),
      totalElements: filteredProducts.length,
    },
  };
}
