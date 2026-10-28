import type { GachaProductSummary } from './gachaProductType';

export interface GachaWithStoreCount extends GachaProductSummary {
  storeCount: number;
}

export interface GachasByCategoryIdsPage {
  products: readonly GachaWithStoreCount[];
  totalCount: number;
}
