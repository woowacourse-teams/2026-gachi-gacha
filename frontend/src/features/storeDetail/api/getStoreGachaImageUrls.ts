import { SUCCESS_CODE } from '@/apis/store';

import type { StoreGachaPageDto, StoreGachaSummaryDto } from './storeGacha.dto';

interface GetStoreGachaImageUrlsOptions {
  signal?: AbortSignal;
}

const PAGE_SIZE = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStoreGachaSummary(value: unknown): StoreGachaSummaryDto | null {
  if (!isRecord(value) || typeof value.gachaId !== 'number') return null;

  const { thumbnailUrl } = value;

  if (thumbnailUrl !== null && typeof thumbnailUrl !== 'string') return null;

  return {
    gachaId: value.gachaId,
    thumbnailUrl,
  };
}

function toStoreGachaPage(body: unknown): StoreGachaPageDto {
  if (!isRecord(body) || body.code !== SUCCESS_CODE || !isRecord(body.data)) {
    throw new Error('store-gachas/invalid-response');
  }

  const { content, number, totalPages } = body.data;

  if (
    !Array.isArray(content) ||
    typeof number !== 'number' ||
    typeof totalPages !== 'number'
  ) {
    throw new Error('store-gachas/invalid-page');
  }

  return {
    content: content
      .map(toStoreGachaSummary)
      .filter((gacha): gacha is StoreGachaSummaryDto => gacha !== null),
    number,
    totalPages,
  };
}

async function getStoreGachaPage(
  storeId: number,
  page: number,
  options: GetStoreGachaImageUrlsOptions,
) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
  });
  const requestOptions: RequestInit = options.signal
    ? { signal: options.signal }
    : {};
  const response = await fetch(
    `/api/v1/stores/${storeId}/gachas?${query}`,
    requestOptions,
  );

  if (!response.ok) {
    throw new Error(`store-gachas/http-${response.status}`);
  }

  return toStoreGachaPage(await response.json());
}

export async function getStoreGachaImageUrls(
  storeId: number,
  options: GetStoreGachaImageUrlsOptions = {},
) {
  const firstPage = await getStoreGachaPage(storeId, 0, options);
  const pages = [firstPage];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    pages.push(await getStoreGachaPage(storeId, page, options));
  }

  const imageUrls = pages.flatMap(({ content }) =>
    content.flatMap(({ thumbnailUrl }) => {
      const normalizedUrl = thumbnailUrl?.trim();

      return normalizedUrl ? [normalizedUrl] : [];
    }),
  );

  return Array.from(new Set(imageUrls));
}
