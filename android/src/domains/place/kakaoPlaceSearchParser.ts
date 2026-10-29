type KakaoPlaceDocument = {
  address_name?: unknown;
  id?: unknown;
  place_name?: unknown;
  road_address_name?: unknown;
  x?: unknown;
  y?: unknown;
};

export type ParsedKakaoPlaceSearchResult = {
  address: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
};

function isKoreanCoordinate(latitude: number, longitude: number): boolean {
  return (
    latitude >= 33 &&
    latitude <= 39 &&
    longitude >= 124 &&
    longitude <= 132
  );
}

export function parseKakaoPlaceSearchResponse(
  value: unknown,
): ParsedKakaoPlaceSearchResult[] {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('documents' in value) ||
    !Array.isArray(value.documents)
  ) {
    throw new Error('카카오 장소 검색 응답 형식이 올바르지 않습니다.');
  }

  return value.documents.flatMap((document: KakaoPlaceDocument) => {
    const id = typeof document.id === 'string' ? document.id.trim() : '';
    const name =
      typeof document.place_name === 'string'
        ? document.place_name.trim()
        : '';
    const roadAddress =
      typeof document.road_address_name === 'string'
        ? document.road_address_name.trim()
        : '';
    const address =
      roadAddress ||
      (typeof document.address_name === 'string'
        ? document.address_name.trim()
        : '');
    const latitude = Number(document.y);
    const longitude = Number(document.x);

    if (
      !id ||
      !name ||
      !address ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !isKoreanCoordinate(latitude, longitude)
    ) {
      return [];
    }

    return [{ id, name, address, latitude, longitude }];
  });
}
