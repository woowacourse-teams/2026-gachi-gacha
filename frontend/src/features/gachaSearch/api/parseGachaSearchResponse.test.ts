import { describe, expect, it } from '@jest/globals';

import { parseGachaSearchResponse } from './parseGachaSearchResponse';

function createProduct(gachaId: number, storeCount?: number) {
  return {
    gachaId,
    name: `가챠 ${gachaId}`,
    thumbnailUrl: null,
    categories: ['캐릭터'],
    ...(storeCount === undefined ? {} : { storeCount }),
  };
}

describe('카테고리 기반 가챠 검색 응답 파싱', () => {
  it('보유 매장 수 내림차순으로 정렬하고 동률의 서버 순서는 유지한다', () => {
    const result = parseGachaSearchResponse({
      code: 'C000',
      message: '정상',
      data: {
        content: [
          createProduct(1, 0),
          createProduct(2, 5),
          createProduct(3, 5),
          createProduct(4, 2),
        ],
        totalElements: 4,
      },
    });

    expect(result.products.map(({ gachaId }) => gachaId)).toEqual([2, 3, 4, 1]);
  });

  it('보유 매장 수가 없는 이전 응답은 계약 오류로 처리한다', () => {
    expect(() =>
      parseGachaSearchResponse({
        code: 'C000',
        message: '정상',
        data: {
          content: [createProduct(1)],
          totalElements: 1,
        },
      }),
    ).toThrow('가챠 검색 결과 형식이 올바르지 않습니다.');
  });
});
