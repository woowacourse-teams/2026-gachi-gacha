export interface MatchedGachaSummary {
  id: number;
  name: string;
}

export interface StoreSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  matchedGachas: readonly MatchedGachaSummary[];
}
