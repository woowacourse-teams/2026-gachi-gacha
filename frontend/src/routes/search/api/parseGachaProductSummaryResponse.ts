import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { isApiResponse } from '@/shared/api/isApiResponse';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGachaProductSummary(value: unknown): value is GachaProductSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isSafeInteger(value.gachaId) &&
    typeof value.name === 'string' &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string')
  );
}

export function parseGachaProductSummaryResponse(
  value: unknown,
): GachaProductSummary {
  if (!isApiResponse(value)) {
    throw new Error('백엔드 공통 응답 형식이 올바르지 않습니다.');
  }

  if (value.code !== 'C000') {
    throw new Error(value.message);
  }

  if (!isGachaProductSummary(value.data)) {
    throw new Error('가챠 응답 형식이 올바르지 않습니다.');
  }

  const { gachaId, name, thumbnailUrl, categories } = value.data;

  return { gachaId, name, thumbnailUrl, categories };
}
