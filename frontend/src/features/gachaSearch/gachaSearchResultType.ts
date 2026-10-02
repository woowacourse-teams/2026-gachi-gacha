import type { GachaWithStoreCount } from '@/domains/product/gachaWithStoreCountType';

export interface GachaSearchResult {
  products: readonly GachaWithStoreCount[];
  totalCount: number;
}
