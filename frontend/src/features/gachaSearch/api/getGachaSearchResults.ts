import {
  getGachasByCategoryIds,
  type GetGachasByCategoryIdsParams,
} from '@/domains/product/api/getGachasByCategoryIds';

import type { GachaSearchResult } from '../gachaSearchResultType';

export async function getGachaSearchResults(
  params: GetGachasByCategoryIdsParams,
  signal?: AbortSignal,
): Promise<GachaSearchResult> {
  return getGachasByCategoryIds(params, signal);
}
