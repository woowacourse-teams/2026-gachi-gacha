import type { GachaProductSummary } from '@/domains/product/gachaProductType';

export interface GachaSearchProduct extends GachaProductSummary {
  storeCount: number;
}

export interface GachaSearchResult {
  products: readonly GachaSearchProduct[];
  totalCount: number;
}
