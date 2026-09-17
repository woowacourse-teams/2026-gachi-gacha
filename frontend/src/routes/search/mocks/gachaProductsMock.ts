import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { ApiResponse } from '@/shared/api/apiResponseType';

// 실제 가챠 상세 응답 중 검색 화면에서 사용하는 필드만 구성한다.
export const gachaProductsMock = [
  {
    gachaId: 10,
    name: '산리오 캐릭터즈 스탠드 피규어',
    thumbnailUrl: null,
    categories: ['산리오', '피규어'],
  },
  {
    gachaId: 11,
    name: '쿠로미 미니 피규어 vol.2',
    thumbnailUrl: null,
    categories: ['산리오', '쿠로미', '피규어'],
  },
  {
    gachaId: 12,
    name: '시나모롤 마스코트 키링',
    thumbnailUrl: null,
    categories: ['산리오', '시나모롤', '키링'],
  },
] satisfies readonly GachaProductSummary[];

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
