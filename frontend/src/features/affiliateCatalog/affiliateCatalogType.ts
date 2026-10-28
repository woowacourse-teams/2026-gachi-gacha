export interface AffiliateCatalogCategory {
  categoryId: number;
  name: string;
}

export interface AffiliateCatalogProduct {
  id: string;
  title: string;
  thumbnailUrl: string;
  affiliateUrl: string;
  categories: readonly AffiliateCatalogCategory[];
  placementPaths: readonly string[];
  activeFrom: string | null;
  activeUntil: string | null;
  order: number;
}

export interface AffiliateCatalog {
  revision: string;
  items: readonly AffiliateCatalogProduct[];
}
