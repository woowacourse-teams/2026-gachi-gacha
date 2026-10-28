import type { GetGachasByCategoryIdsParams } from '@/domains/product/api/getGachasByCategoryIds';
import type { GachaWithStoreCount } from '@/domains/product/gachaWithStoreCountType';
import { gachaProductsMock } from '@/domains/product/mocks/gachaProductsMock';
import type { ApiResponse } from '@/shared/api/apiResponseType';

interface GachaSearchPageMockData {
  content: readonly GachaWithStoreCount[];
  totalElements: number;
}

interface CategoryItemMock {
  categoryId: number;
  name: string;
}

interface CategoryListMockData {
  items: readonly CategoryItemMock[];
}

const categoryItems = [
  ...new Set(gachaProductsMock.flatMap(({ categories }) => categories)),
].map((name, index) => ({ categoryId: index + 1, name }));

const categoryIdByName = new Map(
  categoryItems.map(({ categoryId, name }) => [name, categoryId]),
);

function getMockStoreCount(gachaId: number): number {
  const productIndex = gachaProductsMock.findIndex(
    (product) => product.gachaId === gachaId,
  );

  if (productIndex < 0 || productIndex % 5 === 4) {
    return 0;
  }

  return (productIndex + 1) * 3;
}

export function createCategorySearchMockResponse(
  keyword: string,
): ApiResponse<CategoryListMockData> {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('ko-KR');
  const matchingCategories = categoryItems.filter(({ name }) =>
    name.toLocaleLowerCase('ko-KR').includes(normalizedKeyword),
  );

  return {
    code: 'C000',
    message: '정상',
    data: { items: matchingCategories },
  };
}

export function createGachaSearchMockResponse({
  categoryIds,
  page,
  size,
}: GetGachasByCategoryIdsParams): ApiResponse<GachaSearchPageMockData> {
  const selectedCategoryIds = new Set(categoryIds);
  const filteredProducts = gachaProductsMock
    .filter((product) =>
      product.categories.some((category) => {
        const categoryId = categoryIdByName.get(category);

        return categoryId !== undefined && selectedCategoryIds.has(categoryId);
      }),
    )
    .map((product) => ({
      ...product,
      storeCount: getMockStoreCount(product.gachaId),
    }))
    .sort(
      (firstProduct, secondProduct) =>
        secondProduct.storeCount - firstProduct.storeCount ||
        firstProduct.gachaId - secondProduct.gachaId,
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
