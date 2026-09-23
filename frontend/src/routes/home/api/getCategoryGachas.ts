import { SUCCESS_CODE } from '@/apis/store';

interface GetCategoryGachasOptions {
  signal?: AbortSignal;
}

export interface CategoryGacha {
  gachaId: number;
  name: string;
  thumbnailUrl: string;
}

export interface CategoryGachaPage {
  content: CategoryGacha[];
  number: number;
  totalPages: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toCategoryGacha(value: unknown): CategoryGacha | null {
  if (
    !isRecord(value) ||
    typeof value.gachaId !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.thumbnailUrl !== 'string'
  ) {
    return null;
  }

  return {
    gachaId: value.gachaId,
    name: value.name,
    thumbnailUrl: value.thumbnailUrl,
  };
}

function toCategoryGachaPage(body: unknown): CategoryGachaPage {
  if (!isRecord(body) || body.code !== SUCCESS_CODE || !isRecord(body.data)) {
    throw new Error('category-gachas/invalid-response');
  }

  const { content, number, totalPages } = body.data;

  if (
    !Array.isArray(content) ||
    typeof number !== 'number' ||
    typeof totalPages !== 'number'
  ) {
    throw new Error('category-gachas/invalid-page');
  }

  return {
    content: content
      .map(toCategoryGacha)
      .filter((gacha): gacha is CategoryGacha => gacha !== null),
    number,
    totalPages,
  };
}

export async function getCategoryGachas(
  categoryName: string,
  page: number,
  options: GetCategoryGachasOptions = {},
): Promise<CategoryGachaPage> {
  const query = new URLSearchParams({
    page: String(page),
  });
  const requestOptions: RequestInit = options.signal
    ? { signal: options.signal }
    : {};
  const encodedCategoryName = encodeURIComponent(categoryName);
  const response = await fetch(
    `/api/v1/gachas/category/${encodedCategoryName}?${query}`,
    requestOptions,
  );

  if (!response.ok) {
    throw new Error(`category-gachas/http-${response.status}`);
  }

  return toCategoryGachaPage(await response.json());
}
