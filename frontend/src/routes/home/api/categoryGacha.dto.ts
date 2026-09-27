export interface CategoryGachaDto {
  gachaId: number;
  name: string;
  caption: string;
  thumbnailUrl: string;
  productCode: string;
  categories: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface PageableDto {
  pageNumber: number;
  pageSize: number;
}

export interface CategoryGachaPageDto {
  content: CategoryGachaDto[];
  pageable: PageableDto;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
