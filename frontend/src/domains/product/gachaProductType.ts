export interface GachaProductSummary {
  gachaId: number;
  name: string;
  thumbnailUrl: string | null;
  categories: readonly string[];
}
