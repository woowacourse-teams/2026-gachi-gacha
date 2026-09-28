import type { GachaProductSummary } from '@/domains/product/gachaProductType';

export interface GachaCardPage {
  items: GachaProductSummary[];
  page: number;
  totalPages: number;
}
