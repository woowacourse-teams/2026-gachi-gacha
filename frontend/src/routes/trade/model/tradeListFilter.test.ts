import { describe, expect, it } from '@jest/globals';

import {
  getTradeSortParameter,
  parseTradeCategoryId,
  parseTradeSortOrder,
  parseTradeStatus,
} from './tradeListFilter';

describe('거래 목록 필터 URL 값', () => {
  it.each([
    ['12', 12],
    ['0', null],
    ['-1', null],
    ['1.5', null],
    ['산리오', null],
    [null, null],
  ])('카테고리 식별자 %p를 안전하게 해석한다', (value, expected) => {
    expect(parseTradeCategoryId(value)).toBe(expected);
  });

  it('지원하는 교환 상태만 사용한다', () => {
    expect(parseTradeStatus('AVAILABLE')).toBe('AVAILABLE');
    expect(parseTradeStatus('IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(parseTradeStatus('COMPLETED')).toBe('COMPLETED');
    expect(parseTradeStatus('UNKNOWN')).toBeNull();
  });

  it('지원하지 않는 정렬 값은 최신순으로 복구한다', () => {
    expect(parseTradeSortOrder('oldest')).toBe('oldest');
    expect(parseTradeSortOrder('latest')).toBe('latest');
    expect(parseTradeSortOrder('popular')).toBe('latest');
    expect(parseTradeSortOrder(null)).toBe('latest');
  });

  it('화면 정렬 값을 허용된 API 정렬 값으로 변환한다', () => {
    expect(getTradeSortParameter('latest')).toBe('createdAt,desc');
    expect(getTradeSortParameter('oldest')).toBe('createdAt,asc');
  });
});
