export interface StoreGachaSummaryDto {
  gachaId: number;
  thumbnailUrl: string | null;
}

export interface StoreGachaPageDto {
  content: StoreGachaSummaryDto[];
  number: number;
  totalPages: number;
}
