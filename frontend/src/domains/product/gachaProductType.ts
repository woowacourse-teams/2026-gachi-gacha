export interface GachaProductSummary {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  categories: readonly string[];
}
