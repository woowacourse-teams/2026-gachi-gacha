import { loadKakaoMapsSdk } from '@/shared/map/loadKakaoMapsSdk';

import type { PlaceSearchSelection } from './placeSearchType';

export interface KakaoPlaceSearchResult extends PlaceSearchSelection {
  id: string;
}

function toPlaceSearchResult(
  place: kakao.maps.services.PlacesSearchResultItem,
): KakaoPlaceSearchResult | null {
  const address = place.road_address_name.trim() || place.address_name.trim();
  const latitude = Number(place.y);
  const longitude = Number(place.x);

  if (
    !address ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 33 ||
    latitude > 39 ||
    longitude < 124 ||
    longitude > 132
  ) {
    return null;
  }

  return {
    id: place.id,
    name: place.place_name,
    address,
    latitude,
    longitude,
  };
}

export async function searchKakaoPlaces(
  keyword: string,
): Promise<KakaoPlaceSearchResult[]> {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return [];
  }

  await loadKakaoMapsSdk();

  const services = window.kakao?.maps.services;

  if (!services) {
    throw new Error('카카오 장소 검색을 준비하지 못했습니다.');
  }

  const places = new services.Places();

  return await new Promise((resolve, reject) => {
    places.keywordSearch(normalizedKeyword, (results, status) => {
      if (status === services.Status.OK) {
        resolve(
          results
            .map(toPlaceSearchResult)
            .filter(
              (result): result is KakaoPlaceSearchResult => result !== null,
            ),
        );
        return;
      }

      if (status === services.Status.ZERO_RESULT) {
        resolve([]);
        return;
      }

      reject(new Error('장소를 검색하지 못했습니다.'));
    });
  });
}
