import { describe, expect, it } from '@jest/globals';

import { parseCategoriesResponse } from './parseCategoriesResponse';

describe('카테고리 목록 응답 파싱', () => {
  it('카테고리를 식별자 기준으로 중복 없이 반환한다', () => {
    const result = parseCategoriesResponse({
      code: 'C000',
      message: '정상',
      data: {
        items: [
          { categoryId: 110, name: '산리오' },
          { categoryId: 324, name: '산리오 캐릭터즈' },
          { categoryId: 110, name: '산리오' },
        ],
      },
    });

    expect(result).toEqual([
      { categoryId: 110, name: '산리오' },
      { categoryId: 324, name: '산리오 캐릭터즈' },
    ]);
  });

  it('유효하지 않은 카테고리 식별자가 있으면 실패한다', () => {
    expect(() =>
      parseCategoriesResponse({
        code: 'C000',
        message: '정상',
        data: { items: [{ categoryId: 0, name: '산리오' }] },
      }),
    ).toThrow('카테고리 검색 결과 형식이 올바르지 않습니다.');
  });
});
