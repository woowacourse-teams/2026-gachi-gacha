export interface PlaceSearchSelection {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface KakaoPlaceSearchResult extends PlaceSearchSelection {
  id: string;
}
