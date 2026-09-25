export interface StoreGachaSummary {
  gachaId: number;
  thumbnailUrl: string | null;
}

export interface StoreGachaPage {
  gachas: readonly StoreGachaSummary[];
  totalCount: number;
  page: number;
  totalPages: number;
}
