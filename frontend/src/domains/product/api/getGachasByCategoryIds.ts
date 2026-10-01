import { apiClient } from '@/shared/api/apiClient';

import type { GachasByCategoryIdsPage } from '../gachaWithStoreCountType';
import { parseGachasByCategoryIdsResponse } from './parseGachasByCategoryIdsResponse';

const GACHAS_API_PATH = '/gachas';

export interface GetGachasByCategoryIdsParams {
  categoryIds: readonly number[];
  page: number;
  size: number;
}

export function createGachasByCategoryIdsUrl({
  categoryIds,
  page,
  size,
}: GetGachasByCategoryIdsParams): string {
  const searchParams = new URLSearchParams({
    categoryIds: categoryIds.join(','),
    page: String(page),
    size: String(size),
  });

  return `${GACHAS_API_PATH}?${searchParams}`;
}

export function getGachasByCategoryIds(
  params: GetGachasByCategoryIdsParams,
  signal?: AbortSignal,
): Promise<GachasByCategoryIdsPage> {
  const options: RequestInit = signal ? { signal } : {};

  return apiClient(
    createGachasByCategoryIdsUrl(params),
    parseGachasByCategoryIdsResponse,
    options,
  );
}
