import { describe, expect, it } from '@jest/globals';

import { parseGachasByCategoryIdsResponse } from './parseGachasByCategoryIdsResponse';

function createProduct(gachaId: number, storeCount?: number) {
  return {
    gachaId,
    name: `가챠 ${gachaId}`,
    thumbnailUrl: null,
    categories: ['캐릭터'],
    ...(storeCount === undefined ? {} : { storeCount }),
  };
}

describe('카테고리 ID 기반 가챠 응답 파싱', () => {
  it('백엔드가 내려준 보유 매장 수 순서를 그대로 유지한다', () => {
    const result = parseGachasByCategoryIdsResponse({
      code: 'C000',
      message: '정상',
      data: {
        content: [
          createProduct(2, 5),
          createProduct(3, 5),
          createProduct(4, 2),
          createProduct(1, 0),
        ],
        totalElements: 4,
      },
    });

    expect(result.products.map(({ gachaId }) => gachaId)).toEqual([2, 3, 4, 1]);
  });

  it('보유 매장 수가 없는 이전 응답은 계약 오류로 처리한다', () => {
    expect(() =>
      parseGachasByCategoryIdsResponse({
        code: 'C000',
        message: '정상',
        data: {
          content: [createProduct(1)],
          totalElements: 1,
        },
      }),
    ).toThrow('카테고리 가챠 결과 형식이 올바르지 않습니다.');
  });
});
