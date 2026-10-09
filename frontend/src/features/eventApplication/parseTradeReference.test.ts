import { describe, expect, it } from '@jest/globals';

import { parseTradeReference } from './parseTradeReference';

describe('parseTradeReference', () => {
  it('가치가챠 교환글 링크에서 글 식별자를 추출한다', () => {
    expect(
      parseTradeReference(
        'https://gachigacha.kro.kr/trade/153?from=event#detail',
      ),
    ).toEqual({
      tradeId: 153,
      tradeUrl: 'https://gachigacha.kro.kr/trade/153',
    });
  });

  it('현재 서비스의 상대 경로도 허용한다', () => {
    expect(
      parseTradeReference('/trade/27', 'https://dev.gachigacha.kro.kr'),
    ).toEqual({
      tradeId: 27,
      tradeUrl: 'https://dev.gachigacha.kro.kr/trade/27',
    });
  });

  it.each([
    'https://example.com/trade/1',
    'https://gachigacha.kro.kr/trade/not-number',
    'https://gachigacha.kro.kr/map',
    '',
  ])('가치가챠 교환글이 아닌 %p를 거부한다', (value) => {
    expect(parseTradeReference(value)).toBeNull();
  });
});
