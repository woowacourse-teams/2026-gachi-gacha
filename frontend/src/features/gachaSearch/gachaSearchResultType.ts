import type { GachaProductSummary } from '@/domains/product/gachaProductType';

export interface GachaSearchResult {
  products: readonly GachaProductSummary[];
  totalCount: number;
}
