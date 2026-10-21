export type GachaSearchItem = {
  gachaId: number;
  name: string;
  thumbnailUrl: string | null;
  categories: string[];
  storeCount: number;
};

export type GachaSearchPage = {
  content: GachaSearchItem[];
  pageNumber: number;
  totalElements: number;
  totalPages: number;
};
