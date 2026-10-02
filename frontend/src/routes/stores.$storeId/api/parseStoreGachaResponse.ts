import { isApiResponse } from '@/shared/api/isApiResponse';

import type { StoreGachaPage } from './storeGachaType';

interface StoreGachaPageData {
  content: readonly unknown[];
  totalElements: number;
  number: number;
  totalPages: number;
}

interface StoreGachaSummaryData {
  gachaId: number;
  gachaName: string | null;
  thumbnailUrl: string | null;
}

const UNKNOWN_GACHA_NAME = '이름 미등록 가챠';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isStoreGachaSummaryData(
  value: unknown,
): value is StoreGachaSummaryData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.gachaId === 'number' &&
    Number.isSafeInteger(value.gachaId) &&
    value.gachaId > 0 &&
    (typeof value.gachaName === 'string' || value.gachaName === null) &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null)
  );
}

function normalizeGachaName(gachaName: string | null): string {
  const trimmedName = gachaName?.trim();

  return trimmedName || UNKNOWN_GACHA_NAME;
}

function isStoreGachaPageData(value: unknown): value is StoreGachaPageData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.content) &&
    isNonNegativeSafeInteger(value.totalElements) &&
    isNonNegativeSafeInteger(value.number) &&
    isNonNegativeSafeInteger(value.totalPages)
  );
}

export function parseStoreGachaResponse(value: unknown): StoreGachaPage {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isStoreGachaPageData(value.data)) {
    throw new Error('매장 보유 가챠 페이지 응답 형식이 올바르지 않습니다.');
  }

  if (!value.data.content.every(isStoreGachaSummaryData)) {
    throw new Error('매장 보유 가챠 응답 형식이 올바르지 않습니다.');
  }

  return {
    gachas: value.data.content.map(({ gachaId, gachaName, thumbnailUrl }) => ({
      gachaId,
      gachaName: normalizeGachaName(gachaName),
      thumbnailUrl,
    })),
    totalCount: value.data.totalElements,
    page: value.data.number,
    totalPages: value.data.totalPages,
  };
}
