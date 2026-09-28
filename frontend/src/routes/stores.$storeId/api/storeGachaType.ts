import type { GachaProductSummary } from '@/domains/product/gachaProductType';

export interface StoreGachaPage {
  gachas: readonly GachaProductSummary[];
  totalCount: number;
  page: number;
  totalPages: number;
}
