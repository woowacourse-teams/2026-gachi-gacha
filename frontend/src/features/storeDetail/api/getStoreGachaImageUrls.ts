import { SUCCESS_CODE } from '@/apis/store';

import type { StoreGachaPageDto, StoreGachaSummaryDto } from './storeGacha.dto';

interface GetStoreGachaPageOptions {
  signal?: AbortSignal;
}

export interface StoreGachaPage {
  imageUrls: string[];
  page: number;
  totalPages: number;
}

/**
 * 한 번에 받는 장수.
 *
 * 전에는 100장씩 전체 페이지를 받아 시트를 열었다. 가챠가 250개인 매장은
 * 요청 세 번이 순차로 끝나야 매장 이름이 떴다. 지금은 첫 페이지만 받고,
 * 나머지는 전체 보기에서 스크롤이 닿을 때 이어 받는다.
 */
export const GACHA_PAGE_SIZE = 20;

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

/** 가챠 사진 한 페이지. 빈 URL 은 걸러내고 중복도 없앤다. */
export async function getStoreGachaPage(
  storeId: number,
  page: number,
  options: GetStoreGachaPageOptions = {},
): Promise<StoreGachaPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(GACHA_PAGE_SIZE),
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

  const dto = toStoreGachaPage(await response.json());
  const imageUrls = dto.content.flatMap(({ thumbnailUrl }) => {
    const normalizedUrl = thumbnailUrl?.trim();

    return normalizedUrl ? [normalizedUrl] : [];
  });

  return {
    imageUrls: Array.from(new Set(imageUrls)),
    page: dto.number,
    totalPages: dto.totalPages,
  };
}
