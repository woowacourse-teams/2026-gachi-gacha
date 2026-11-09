import { describe, expect, it } from '@jest/globals';

import { zIndex } from './tokens';

/** 교환 상세의 모바일 헤더(40)·관리 메뉴(41)·하단 채팅하기 바(35) 중 가장 높은 값 */
const TRADE_DETAIL_FIXED_BAR_MAX = 41;

describe('zIndex', () => {
  it('채팅 모달은 헤더와 상세 화면 고정 바 위, 확인 창과 사진 보기 아래에 둔다', () => {
    expect(zIndex.modal).toBeGreaterThan(zIndex.header);
    expect(zIndex.modal).toBeGreaterThan(TRADE_DETAIL_FIXED_BAR_MAX);
    expect(zIndex.modal + 1).toBeLessThan(zIndex.overlay);
  });
});
