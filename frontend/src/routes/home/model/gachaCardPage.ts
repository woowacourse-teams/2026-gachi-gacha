import type { GachaProductSummary } from '@/domains/product/gachaProductType';

export interface GachaCardPage {
  items: GachaProductSummary[];
  nextPage: number | null;
}
