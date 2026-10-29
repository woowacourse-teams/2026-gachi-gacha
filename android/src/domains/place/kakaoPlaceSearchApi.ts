import { getKakaoPlaceSearchRestApiKey } from '../../config/placeSearch';
import { parseKakaoPlaceSearchResponse } from './kakaoPlaceSearchParser';
import type { KakaoPlaceSearchResult } from './placeSearchTypes';

const KAKAO_KEYWORD_SEARCH_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';

export async function searchKakaoPlaces(
  keyword: string,
  signal?: AbortSignal,
): Promise<KakaoPlaceSearchResult[]> {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return [];
  }

  const params = new URLSearchParams({
    page: '1',
    query: normalizedKeyword,
    size: '15',
  });
  const response = await fetch(`${KAKAO_KEYWORD_SEARCH_URL}?${params}`, {
    headers: {
      Authorization: `KakaoAK ${getKakaoPlaceSearchRestApiKey()}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('장소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  return parseKakaoPlaceSearchResponse(await response.json()) satisfies KakaoPlaceSearchResult[];
}
