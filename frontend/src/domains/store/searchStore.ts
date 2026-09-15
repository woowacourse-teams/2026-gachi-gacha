export interface MatchedGachaSummary {
  id: number;
  name: string;
}

export interface SearchStore {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  matchedGachas: readonly MatchedGachaSummary[];
}
