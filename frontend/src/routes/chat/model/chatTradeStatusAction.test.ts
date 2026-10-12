import { describe, expect, it } from '@jest/globals';

import { getChatTradeStatusAction } from './chatTradeStatusAction';

describe('getChatTradeStatusAction', () => {
  it('작성자에게 현재 상태의 다음 액션만 제공한다', () => {
    expect(getChatTradeStatusAction('AVAILABLE', true)).toEqual({
      label: '예약 확정',
      nextStatus: 'IN_PROGRESS',
    });
    expect(getChatTradeStatusAction('IN_PROGRESS', true)).toEqual({
      label: '거래 완료',
      nextStatus: 'COMPLETED',
    });
    expect(getChatTradeStatusAction('COMPLETED', true)).toBeNull();
  });

  it('작성자가 아니면 상태 변경 액션을 제공하지 않는다', () => {
    expect(getChatTradeStatusAction('AVAILABLE', false)).toBeNull();
    expect(getChatTradeStatusAction('IN_PROGRESS', false)).toBeNull();
  });
});
