import { describe, expect, it } from '@jest/globals';

import { parseStoreGachaResponse } from './parseStoreGachaResponse';

describe('매장 보유 가챠 응답 파싱', () => {
  it('가챠 이름과 섬네일을 페이지 정보와 함께 반환한다', () => {
    const result = parseStoreGachaResponse({
      code: 'C000',
      message: '정상',
      data: {
        content: [
          {
            gachaId: 10,
            gachaName: '산리오 캐릭터즈 피규어',
            thumbnailUrl: 'https://example.com/gacha.jpg',
          },
        ],
        totalElements: 1,
        number: 0,
        totalPages: 1,
      },
    });

    expect(result).toEqual({
      gachas: [
        {
          gachaId: 10,
          gachaName: '산리오 캐릭터즈 피규어',
          thumbnailUrl: 'https://example.com/gacha.jpg',
        },
      ],
      totalCount: 1,
      page: 0,
      totalPages: 1,
    });
  });

  it('gachaName이 없는 이전 응답은 계약 오류로 처리한다', () => {
    expect(() =>
      parseStoreGachaResponse({
        code: 'C000',
        message: '정상',
        data: {
          content: [
            {
              gachaId: 10,
              name: '산리오 캐릭터즈 피규어',
              thumbnailUrl: null,
            },
          ],
          totalElements: 1,
          number: 0,
          totalPages: 1,
        },
      }),
    ).toThrow('매장 보유 가챠 응답 형식이 올바르지 않습니다.');
  });
});
