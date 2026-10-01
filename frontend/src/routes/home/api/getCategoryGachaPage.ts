import { getGachasByCategoryIds } from '@/domains/product/api/getGachasByCategoryIds';

import type { GachaCardPage } from '../model/gachaCardPage';

interface GetCategoryGachaPageParams {
  categoryId: number;
  page: number;
  signal: AbortSignal;
}

const CATEGORY_GACHA_PAGE_SIZE = 12;

export async function getCategoryGachaPage({
  categoryId,
  page,
  signal,
}: GetCategoryGachaPageParams): Promise<GachaCardPage> {
  const { products, totalCount } = await getGachasByCategoryIds(
    {
      categoryIds: [categoryId],
      page,
      size: CATEGORY_GACHA_PAGE_SIZE,
    },
    signal,
  );
  const loadedItemCount = page * CATEGORY_GACHA_PAGE_SIZE + products.length;

  return {
    items: products.map(({ gachaId, name, thumbnailUrl, categories }) => ({
      gachaId,
      name,
      thumbnailUrl,
      categories,
    })),
    nextPage: loadedItemCount < totalCount ? page + 1 : null,
  };
}
