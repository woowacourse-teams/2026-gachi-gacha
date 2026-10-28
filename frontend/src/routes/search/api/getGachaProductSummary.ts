import type { GachaProductSummary } from '@/domains/product/gachaProductType';

import { parseGachaProductSummaryResponse } from './parseGachaProductSummaryResponse';

const GACHAS_API_PATH = '/api/v1/gachas';
const JSON_CONTENT_TYPE = 'application/json';

export async function getGachaProductSummary(
  gachaId: number,
  signal?: AbortSignal,
): Promise<GachaProductSummary> {
  const response = await fetch(`${GACHAS_API_PATH}/${gachaId}`, {
    signal: signal ?? null,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const responseBody: unknown = await response.json();

  return parseGachaProductSummaryResponse(responseBody);
}
