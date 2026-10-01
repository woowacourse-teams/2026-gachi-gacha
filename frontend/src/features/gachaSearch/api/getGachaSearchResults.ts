import { apiClient } from '@/shared/api/apiClient';

import type { GachaSearchResult } from '../gachaSearchResultType';
import { createGachaSearchUrl } from './createGachaSearchUrl';
import type { GachaSearchPageParams } from './gachaSearchParamsType';
import { parseGachaSearchResponse } from './parseGachaSearchResponse';

export async function getGachaSearchResults(
  params: GachaSearchPageParams,
  signal?: AbortSignal,
): Promise<GachaSearchResult> {
  const options: RequestInit = signal ? { signal } : {};

  return apiClient(
    createGachaSearchUrl(params),
    parseGachaSearchResponse,
    options,
  );
}
