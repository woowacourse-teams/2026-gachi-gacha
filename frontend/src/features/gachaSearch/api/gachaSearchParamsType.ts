export interface GachaSearchParams {
  keyword: string;
  page: number;
  size: number;
}

export interface GachaSearchPageParams {
  categoryIds: readonly number[];
  page: number;
  size: number;
}
