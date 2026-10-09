import { describe, expect, it } from '@jest/globals';

import { getChatTradeAction } from './chatTradeAction';

describe('getChatTradeAction', () => {
  it('교환 가능한 글의 작성자에게만 예약 확정을 허용한다', () => {
    expect(
      getChatTradeAction({
        status: 'AVAILABLE',
        isReservedRoom: false,
        isTradeOwner: true,
      }),
    ).toBe('confirm_reservation');
    expect(
      getChatTradeAction({
        status: 'AVAILABLE',
        isReservedRoom: false,
        isTradeOwner: false,
      }),
    ).toBeNull();
  });

  it('예약된 방에서 작성자는 취소하고 구매 희망자는 완료할 수 있다', () => {
    expect(
      getChatTradeAction({
        status: 'IN_PROGRESS',
        isReservedRoom: true,
        isTradeOwner: true,
      }),
    ).toBe('cancel_reservation');
    expect(
      getChatTradeAction({
        status: 'IN_PROGRESS',
        isReservedRoom: true,
        isTradeOwner: false,
      }),
    ).toBe('complete_trade');
  });

  it('다른 방에서 예약됐거나 완료된 글에는 액션을 제공하지 않는다', () => {
    expect(
      getChatTradeAction({
        status: 'IN_PROGRESS',
        isReservedRoom: false,
        isTradeOwner: true,
      }),
    ).toBeNull();
    expect(
      getChatTradeAction({
        status: 'COMPLETED',
        isReservedRoom: true,
        isTradeOwner: false,
      }),
    ).toBeNull();
  });
});
