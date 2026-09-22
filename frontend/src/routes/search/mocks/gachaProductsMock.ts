import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import { gachaProductsMock } from '@/domains/product/mocks/gachaProductsMock';
import type { ApiResponse } from '@/shared/api/apiResponseType';

export function createGachaProductMockResponse(
  gachaId: number,
): ApiResponse<GachaProductSummary> | null {
  const product = gachaProductsMock.find((gacha) => gacha.gachaId === gachaId);

  if (!product) {
    return null;
  }

  return {
    code: 'C000',
    message: '정상',
    data: product,
  };
}
